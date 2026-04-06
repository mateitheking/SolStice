import os
import json
import hashlib
import asyncio
import sqlite3
from contextlib import asynccontextmanager
from datetime import datetime, timezone

import httpx
from dotenv import load_dotenv
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

load_dotenv()

# --- config ---

DB_PATH = "agent.db"
INTERVAL_SECONDS = int(os.getenv("INTERVAL_SECONDS", "300"))
WINDOW_SIZE = int(os.getenv("WINDOW_SIZE", "12"))
COINGECKO_BASE_URL = os.getenv(
    "COINGECKO_BASE_URL",
    "https://api.coingecko.com/api/v3",
)
SDK_BRIDGE_URL = os.getenv("SDK_BRIDGE_URL", "http://localhost:3001")

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
CUSTOM_MODEL_ID = os.getenv("CUSTOM_MODEL_ID", "")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "solstice-trader")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

active_model = os.getenv("DEFAULT_MODEL", "claude")  # "claude" | "openai" | "custom" | "rule"
active_strategy = "conservative"  # "conservative" | "aggressive"
active_user_pubkey = os.getenv("USER_PUBKEY", "")

stop_event = asyncio.Event()

_anthropic_client = None
_openai_client = None


def get_anthropic_client():
    global _anthropic_client
    if _anthropic_client is None and ANTHROPIC_API_KEY:
        import anthropic
        _anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    return _anthropic_client


def get_openai_client():
    global _openai_client
    if _openai_client is None and OPENAI_API_KEY:
        from openai import OpenAI
        _openai_client = OpenAI(api_key=OPENAI_API_KEY)
    return _openai_client


print(f"INTERVAL={INTERVAL_SECONDS}s  WINDOW={WINDOW_SIZE}")
print(f"MODEL={active_model}  ANTHROPIC={'yes' if ANTHROPIC_API_KEY else 'no'}  OPENAI={'yes' if OPENAI_API_KEY else 'no'}")
print(f"SDK_BRIDGE={SDK_BRIDGE_URL}")

# --- database ---


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def init_db():
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS prices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ts TEXT NOT NULL,
                sol_usd REAL NOT NULL,
                usdc_usd REAL NOT NULL,
                sol_usdc REAL NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS decisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ts TEXT NOT NULL,
                price REAL NOT NULL,
                action TEXT NOT NULL,
                reason TEXT NOT NULL,
                confidence REAL DEFAULT 0.0,
                reasoning_hash TEXT DEFAULT '',
                model TEXT DEFAULT 'rule',
                strategy TEXT DEFAULT 'conservative',
                tx_hash TEXT DEFAULT ''
            )
        """)
        conn.commit()

    _migrate_decisions_table()


def _migrate_decisions_table():
    """Add new columns to existing DBs without losing data."""
    with get_conn() as conn:
        existing = [
            row[1] for row in conn.execute("PRAGMA table_info(decisions)").fetchall()
        ]
        migrations = {
            "confidence": "REAL DEFAULT 0.0",
            "reasoning_hash": "TEXT DEFAULT ''",
            "model": "TEXT DEFAULT 'rule'",
            "strategy": "TEXT DEFAULT 'conservative'",
            "tx_hash": "TEXT DEFAULT ''",
        }
        for col, col_type in migrations.items():
            if col not in existing:
                conn.execute(f"ALTER TABLE decisions ADD COLUMN {col} {col_type}")
        conn.commit()


# --- price fetching ---


async def fetch_price():
    params = {
        "ids": "solana,usd-coin",
        "vs_currencies": "usd",
        "include_last_updated_at": "true",
    }

    async with httpx.AsyncClient(timeout=15) as http:
        resp = await http.get(f"{COINGECKO_BASE_URL}/simple/price", params=params)
        resp.raise_for_status()
        data = resp.json()

    sol_usd = float(data["solana"]["usd"])
    usdc_usd = float(data["usd-coin"]["usd"])
    sol_usdc = sol_usd / usdc_usd if usdc_usd else sol_usd

    return {
        "ts": now_iso(),
        "sol_usd": sol_usd,
        "usdc_usd": usdc_usd,
        "sol_usdc": sol_usdc,
    }


def save_price(price_data):
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO prices (ts, sol_usd, usdc_usd, sol_usdc) VALUES (?,?,?,?)",
            (price_data["ts"], price_data["sol_usd"],
             price_data["usdc_usd"], price_data["sol_usdc"]),
        )
        conn.commit()


def get_recent_prices(limit=12):
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT sol_usdc FROM prices ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
    prices = [row["sol_usdc"] for row in rows]
    prices.reverse()
    return prices


# --- reasoning hash ---


def hash_reasoning(reason: str, price: float, action: str) -> str:
    """SHA-256 of action + price + reason. Stored on-chain so decisions can be verified."""
    payload = f"{action}|{price}|{reason}"
    return hashlib.sha256(payload.encode()).hexdigest()


# --- decision engines ---

SYSTEM_PROMPT = (
    "You are a trading decision module for an autonomous on-chain AI trader. "
    "Respond ONLY with valid JSON, no markdown fences, no extra text. "
    'Schema: {"action": "BUY"|"SELL"|"HOLD", "reason": "string (max 2 sentences)", '
    '"confidence": float between 0.0 and 1.0}. '
    "confidence reflects how certain you are in this decision."
)


def _build_user_prompt(prices: list[float], strategy: str) -> str:
    rounded = [round(p, 4) for p in prices]
    return (
        f"SOL/USDC prices over the last hour (oldest to newest): {rounded}. "
        f"Strategy: {strategy}. "
        "Analyze the trend and return your trading decision as JSON."
    )


def _parse_llm_response(raw: str) -> dict:
    text = raw.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

    data = json.loads(text)

    if data["action"] not in ("BUY", "SELL", "HOLD"):
        raise ValueError(f"Invalid action: {data['action']}")

    data.setdefault("confidence", 0.5)
    data["confidence"] = max(0.0, min(1.0, float(data["confidence"])))
    return data


def claude_decision(prices: list[float], strategy: str) -> dict:
    client = get_anthropic_client()
    if not client:
        raise RuntimeError("Anthropic API key not configured")

    resp = client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=256,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": _build_user_prompt(prices, strategy)}],
    )
    return _parse_llm_response(resp.content[0].text)


def openai_decision(prices: list[float], strategy: str) -> dict:
    client = get_openai_client()
    if not client:
        raise RuntimeError("OpenAI API key not configured")

    resp = client.chat.completions.create(
        model=OPENAI_MODEL,
        max_tokens=256,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_prompt(prices, strategy)},
        ],
    )
    return _parse_llm_response(resp.choices[0].message.content)


async def fetch_solana_context() -> str:
    """Pull live Solana ecosystem stats to enrich the custom model prompt."""
    parts = []
    try:
        async with httpx.AsyncClient(timeout=10) as http:
            r = await http.get("https://api.llama.fi/v2/chains")
            chains = r.json()
            for c in chains:
                if c.get("name") == "Solana":
                    tvl = c.get("tvl", 0)
                    parts.append(f"Solana TVL: ${tvl/1e9:.2f}B")
                    break
    except Exception:
        pass

    try:
        async with httpx.AsyncClient(timeout=10) as http:
            r = await http.get(
                "https://api.coingecko.com/api/v3/simple/price",
                params={"ids": "solana", "vs_currencies": "usd",
                        "include_24hr_change": "true",
                        "include_24hr_vol": "true",
                        "include_market_cap": "true"},
            )
            d = r.json().get("solana", {})
            if d.get("usd_market_cap"):
                parts.append(f"SOL market cap: ${d['usd_market_cap']/1e9:.1f}B")
            if d.get("usd_24h_vol"):
                parts.append(f"24h volume: ${d['usd_24h_vol']/1e6:.0f}M")
            if d.get("usd_24h_change"):
                parts.append(f"24h change: {d['usd_24h_change']:.2f}%")
    except Exception:
        pass

    return " | ".join(parts) if parts else ""


def _build_solana_prompt(prices: list[float], strategy: str) -> tuple[str, str]:
    """Compute basic technical indicators and build the prompt for the SolStice model."""
    rounded = [round(p, 4) for p in prices]
    first, last = rounded[0], rounded[-1]
    change = ((last - first) / first) * 100
    sma_short = sum(rounded[-6:]) / min(6, len(rounded[-6:]))
    sma_long = sum(rounded) / len(rounded)
    mean = sum(rounded) / len(rounded)
    vol = (sum((v - mean)**2 for v in rounded) / len(rounded)) ** 0.5

    system = (
        "You are SolStice AI — a specialized autonomous trading agent for Solana. "
        "You have deep knowledge of Solana's ecosystem, DeFi protocols, and price patterns. "
        "Respond ONLY with valid JSON: "
        '{"action": "BUY"|"SELL"|"HOLD", "reason": "string", "confidence": float 0.0-1.0}.'
    )

    prompt = (
        f"SOL/USDC prices (last {len(rounded)} hours, oldest→newest): {rounded}. "
        f"Strategy: {strategy}. "
        f"Technical: change={change:.3f}%, SMA(6h)=${sma_short:.4f}, "
        f"SMA(full)=${sma_long:.4f}, volatility={vol:.4f}. "
        "Analyze and return your trading decision as JSON."
    )
    return system, prompt


def custom_decision(prices: list[float], strategy: str) -> dict:
    """Try local Ollama model first, fall back to OpenAI fine-tuned if unavailable."""
    system, prompt = _build_solana_prompt(prices, strategy)

    try:
        resp = httpx.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                "stream": False,
                "options": {"temperature": 0.3},
            },
            timeout=60,
        )
        if resp.status_code == 200:
            data = resp.json()
            raw = data.get("message", {}).get("content", "")
            return _parse_llm_response(raw)
    except Exception as e:
        print(f"[custom] Ollama not available: {e}")

    if CUSTOM_MODEL_ID:
        client = get_openai_client()
        if client:
            resp = client.chat.completions.create(
                model=CUSTOM_MODEL_ID,
                max_tokens=256,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
            )
            return _parse_llm_response(resp.choices[0].message.content)

    raise RuntimeError("No custom model available (Ollama not running, no CUSTOM_MODEL_ID)")


def rule_decision(prices: list[float], strategy: str) -> dict:
    if len(prices) < 2:
        return {"action": "HOLD", "reason": "Not enough price history.", "confidence": 0.1}

    first, last = prices[0], prices[-1]
    change_pct = ((last - first) / first) * 100

    threshold = 0.3 if strategy == "aggressive" else 0.5

    if change_pct > threshold:
        conf = min(0.9, 0.5 + abs(change_pct) / 5)
        return {"action": "BUY", "reason": f"Price up {change_pct:.2f}% over window.", "confidence": round(conf, 2)}

    if change_pct < -threshold:
        conf = min(0.9, 0.5 + abs(change_pct) / 5)
        return {"action": "SELL", "reason": f"Price down {change_pct:.2f}% over window.", "confidence": round(conf, 2)}

    return {"action": "HOLD", "reason": f"Price change {change_pct:.2f}% within threshold.", "confidence": 0.3}


def make_decision(prices: list[float], strategy: str, model: str) -> dict:
    """Route to the selected model, fall back to rule-based on any error."""
    engines = {
        "claude": claude_decision,
        "openai": openai_decision,
        "custom": custom_decision,
        "rule": rule_decision,
    }

    engine = engines.get(model, rule_decision)

    try:
        return engine(prices, strategy)
    except Exception as e:
        print(f"[{model}] error, fallback to rule-based:", e)
        return rule_decision(prices, strategy)


# --- sdk bridge ---


async def execute_on_chain(action: str, amount: float, price: float, reason: str) -> str | None:
    """Send the trade decision to the Node.js bridge, which submits it on-chain.
    Returns the tx hash, or None if the call failed.
    """
    if not active_user_pubkey:
        print("[SDK] No USER_PUBKEY configured, skipping on-chain execution")
        return None

    payload = {
        "action": action.lower(),
        "amountSOL": amount,
        "priceUSD": price,
        "reason": reason[:200],
        "userPubkey": active_user_pubkey,
    }

    try:
        async with httpx.AsyncClient(timeout=30) as http:
            resp = await http.post(f"{SDK_BRIDGE_URL}/execute", json=payload)
            resp.raise_for_status()
            data = resp.json()
            tx_hash = data.get("txHash", "")
            print(f"[SDK] on-chain tx: {tx_hash}")
            return tx_hash
    except Exception as e:
        print(f"[SDK] bridge error: {e}")
        return None


# --- save decision ---


def save_decision(price: float, decision: dict, model: str, strategy: str, tx_hash: str = ""):
    reasoning_h = hash_reasoning(decision["reason"], price, decision["action"])

    with get_conn() as conn:
        conn.execute(
            """INSERT INTO decisions
               (ts, price, action, reason, confidence, reasoning_hash, model, strategy, tx_hash)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            (
                now_iso(), price, decision["action"], decision["reason"],
                decision.get("confidence", 0.0), reasoning_h,
                model, strategy, tx_hash,
            ),
        )
        conn.commit()


# --- helpers ---


def get_last_price_row():
    with get_conn() as conn:
        row = conn.execute(
            "SELECT ts, sol_usdc FROM prices ORDER BY id DESC LIMIT 1"
        ).fetchone()
    return dict(row) if row else None


def get_last_decision_row():
    with get_conn() as conn:
        row = conn.execute(
            "SELECT ts, price, action, reason, confidence, reasoning_hash, model, tx_hash "
            "FROM decisions ORDER BY id DESC LIMIT 1"
        ).fetchone()
    return dict(row) if row else None


# --- agent loop ---


def compute_trade_amount(confidence: float, strategy: str) -> float:
    """Scale position size by confidence. Skip trades below 0.5."""
    base = 0.1  # SOL
    if strategy == "aggressive":
        base = 0.2

    if confidence >= 0.8:
        return base
    elif confidence >= 0.5:
        return base * 0.5
    else:
        return 0.0


async def run_agent_once():
    price_data = await fetch_price()
    save_price(price_data)

    prices = get_recent_prices(WINDOW_SIZE)
    current_price = price_data["sol_usdc"]

    if len(prices) < WINDOW_SIZE:
        decision = {"action": "HOLD", "reason": "Not enough price history yet.", "confidence": 0.1}
    else:
        decision = make_decision(prices, active_strategy, active_model)

    tx_hash = ""
    if decision["action"] in ("BUY", "SELL"):
        amount = compute_trade_amount(decision.get("confidence", 0.5), active_strategy)
        if amount > 0:
            tx_hash = await execute_on_chain(
                decision["action"], amount, current_price, decision["reason"]
            ) or ""
        else:
            decision["reason"] += " (skipped: low confidence)"

    save_decision(current_price, decision, active_model, active_strategy, tx_hash)

    return {
        "timestamp": price_data["ts"],
        "price": current_price,
        "action": decision["action"],
        "reason": decision["reason"],
        "confidence": decision.get("confidence", 0.0),
        "reasoning_hash": hash_reasoning(decision["reason"], current_price, decision["action"]),
        "model": active_model,
        "strategy": active_strategy,
        "tx_hash": tx_hash,
    }


async def agent_loop():
    while not stop_event.is_set():
        try:
            result = await run_agent_once()
            print(
                f"[{result['model']}] {result['action']} "
                f"confidence={result['confidence']:.2f} "
                f"price={result['price']:.4f} "
                f"tx={result['tx_hash'][:16] + '...' if result['tx_hash'] else 'none'}"
            )
        except Exception as e:
            print("agent error:", e)

        try:
            await asyncio.wait_for(stop_event.wait(), timeout=INTERVAL_SECONDS)
        except asyncio.TimeoutError:
            pass


# --- fastapi ---


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    task = asyncio.create_task(agent_loop())
    try:
        yield
    finally:
        stop_event.set()
        await task


app = FastAPI(title="SolStice AI Agent", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/gui", response_class=HTMLResponse)
def gui():
    html_path = Path(__file__).parent / "gui.html"
    return html_path.read_text(encoding="utf-8")


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/status")
def status():
    return {
        "agent": "online",
        "model": active_model,
        "strategy": active_strategy,
        "interval_seconds": INTERVAL_SECONDS,
        "anthropic_enabled": bool(ANTHROPIC_API_KEY),
        "openai_enabled": bool(OPENAI_API_KEY),
        "sdk_bridge": SDK_BRIDGE_URL,
        "user_pubkey": active_user_pubkey[:8] + "..." if active_user_pubkey else "",
        "last_price": get_last_price_row(),
        "last_decision": get_last_decision_row(),
    }


@app.get("/prices")
def prices():
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT ts, sol_usd, sol_usdc FROM prices ORDER BY id DESC LIMIT 50"
        ).fetchall()
    return [dict(r) for r in rows]


@app.get("/decisions")
def decisions():
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT ts, price, action, reason, confidence, reasoning_hash, model, strategy, tx_hash "
            "FROM decisions ORDER BY id DESC LIMIT 100"
        ).fetchall()
    return [dict(r) for r in rows]


@app.post("/run-once")
async def run_once():
    return await run_agent_once()


@app.post("/set-model")
async def set_model(body: dict):
    global active_model
    model = body.get("model", "").lower()
    if model not in ("claude", "openai", "custom", "rule"):
        return {"error": "model must be claude, openai, custom, or rule"}
    active_model = model
    return {"model": active_model}


@app.post("/set-strategy")
async def set_strategy(body: dict):
    global active_strategy
    strategy = body.get("strategy", "").lower()
    if strategy not in ("conservative", "aggressive"):
        return {"error": "strategy must be conservative or aggressive"}
    active_strategy = strategy
    return {"strategy": active_strategy}


@app.get("/config")
def config():
    return {
        "model": active_model,
        "strategy": active_strategy,
        "available_models": {
            "claude": bool(ANTHROPIC_API_KEY),
            "openai": bool(OPENAI_API_KEY),
            "custom": bool(CUSTOM_MODEL_ID) or bool(OLLAMA_MODEL),
            "rule": True,
        },
        "interval_seconds": INTERVAL_SECONDS,
        "window_size": WINDOW_SIZE,
    }

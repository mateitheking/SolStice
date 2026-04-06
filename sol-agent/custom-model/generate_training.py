"""
Step 2: Generate fine-tuning dataset from collected Solana data.

Creates JSONL file in OpenAI fine-tuning format:
  {"messages": [{"role":"system","content":"..."}, {"role":"user","content":"..."}, {"role":"assistant","content":"..."}]}

The model learns:
  - Solana price patterns and what actions to take
  - Solana ecosystem context (TVL, protocols, network health)
  - Risk management based on volatility
  - Confidence scoring
"""

import json
import random
from pathlib import Path
from datetime import datetime

RAW_DIR = Path("raw_data")
OUT_FILE = Path("training_data.jsonl")

SYSTEM_PROMPT = (
    "You are SolStice AI — a specialized autonomous trading agent built exclusively for the Solana blockchain. "
    "You have deep knowledge of Solana's ecosystem: its DeFi protocols (Jupiter, Raydium, Marinade, Jito), "
    "network mechanics (TPS, validators, epochs, staking), tokenomics (inflation schedule, staking rewards), "
    "and historical price behavior patterns. "
    "You analyze SOL/USDC price data, on-chain metrics, ecosystem TVL trends, and market conditions "
    "to make trading decisions. "
    "You always respond with valid JSON: "
    '{"action": "BUY"|"SELL"|"HOLD", "reason": "string (max 2 sentences)", "confidence": float 0.0-1.0}. '
    "Your confidence reflects conviction: >0.8 for strong signals with multiple confirming indicators, "
    "0.5-0.8 for moderate signals, <0.5 when uncertain. "
    "You understand that Solana's price is affected by: network upgrades, ecosystem growth/TVL changes, "
    "validator economics, major protocol launches, and broader crypto market sentiment."
)


def load_prices():
    data = json.loads((RAW_DIR / "sol_prices_90d.json").read_text())
    return data["prices"], data["volumes"]


def load_tvl():
    return json.loads((RAW_DIR / "solana_tvl.json").read_text())


def load_protocols():
    return json.loads((RAW_DIR / "solana_protocols.json").read_text())


def load_market():
    return json.loads((RAW_DIR / "sol_market.json").read_text())


def compute_indicators(prices_window):
    """Compute technical indicators from a price window."""
    if len(prices_window) < 2:
        return {}

    values = [p["price"] for p in prices_window]
    first, last = values[0], values[-1]
    change_pct = ((last - first) / first) * 100

    # Simple Moving Averages
    sma_short = sum(values[-6:]) / min(6, len(values[-6:]))  # 6h SMA
    sma_long = sum(values) / len(values)  # full window SMA

    # Volatility (std dev)
    mean = sum(values) / len(values)
    variance = sum((v - mean) ** 2 for v in values) / len(values)
    volatility = variance ** 0.5

    # Min/Max
    high = max(values)
    low = min(values)
    range_pct = ((high - low) / low) * 100 if low > 0 else 0

    # Momentum (rate of change)
    mid = len(values) // 2
    first_half_avg = sum(values[:mid]) / max(mid, 1)
    second_half_avg = sum(values[mid:]) / max(len(values) - mid, 1)
    momentum = ((second_half_avg - first_half_avg) / first_half_avg) * 100 if first_half_avg > 0 else 0

    return {
        "change_pct": round(change_pct, 3),
        "sma_short": round(sma_short, 4),
        "sma_long": round(sma_long, 4),
        "volatility": round(volatility, 4),
        "high": round(high, 4),
        "low": round(low, 4),
        "range_pct": round(range_pct, 3),
        "momentum": round(momentum, 3),
        "current": round(last, 4),
    }


def decide_label(indicators, tvl_trend=None):
    """Generate the 'correct' trading decision based on indicators.
    This is the ground truth for fine-tuning.
    """
    change = indicators.get("change_pct", 0)
    momentum = indicators.get("momentum", 0)
    volatility = indicators.get("volatility", 0)
    sma_short = indicators.get("sma_short", 0)
    sma_long = indicators.get("sma_long", 0)
    current = indicators.get("current", 0)
    range_pct = indicators.get("range_pct", 0)

    # TVL context
    tvl_boost = 0
    tvl_context = ""
    if tvl_trend == "growing":
        tvl_boost = 0.1
        tvl_context = " Solana ecosystem TVL is growing, indicating increased adoption."
    elif tvl_trend == "declining":
        tvl_boost = -0.1
        tvl_context = " Solana TVL is declining, suggesting reduced ecosystem activity."

    # Decision logic
    signals = 0
    reasons = []

    # Price trend
    if change > 1.0:
        signals += 2
        reasons.append(f"SOL up {change:.1f}% showing bullish momentum")
    elif change > 0.3:
        signals += 1
        reasons.append(f"SOL showing moderate uptrend ({change:.1f}%)")
    elif change < -1.0:
        signals -= 2
        reasons.append(f"SOL down {change:.1f}% indicating bearish pressure")
    elif change < -0.3:
        signals -= 1
        reasons.append(f"SOL showing slight weakness ({change:.1f}%)")

    # SMA crossover
    if sma_short > sma_long * 1.002:
        signals += 1
        reasons.append("short-term SMA above long-term (bullish crossover)")
    elif sma_short < sma_long * 0.998:
        signals -= 1
        reasons.append("short-term SMA below long-term (bearish crossover)")

    # Momentum
    if momentum > 0.5:
        signals += 1
    elif momentum < -0.5:
        signals -= 1

    # High volatility = lower confidence
    vol_penalty = min(volatility / current * 100, 0.3) if current > 0 else 0

    # TVL influence
    if tvl_boost > 0:
        signals += 1
    elif tvl_boost < 0:
        signals -= 1

    # Final decision
    if signals >= 2:
        action = "BUY"
        base_conf = min(0.9, 0.6 + signals * 0.08)
        reason = ". ".join(reasons[:2]) + "." + tvl_context
    elif signals <= -2:
        action = "SELL"
        base_conf = min(0.9, 0.6 + abs(signals) * 0.08)
        reason = ". ".join(reasons[:2]) + "." + tvl_context
    else:
        action = "HOLD"
        base_conf = 0.3 + abs(signals) * 0.05
        if reasons:
            reason = "Mixed signals: " + reasons[0] + ". No clear directional conviction." + tvl_context
        else:
            reason = "Price stable within normal range. Waiting for stronger signal." + tvl_context

    confidence = round(max(0.1, min(0.95, base_conf - vol_penalty + tvl_boost)), 2)

    return {
        "action": action,
        "reason": reason.strip()[:200],
        "confidence": confidence,
    }


def build_user_prompt(prices_window, indicators, strategy="conservative", extra_context=""):
    """Build the user prompt with Solana-specific context."""
    values = [round(p["price"], 2) for p in prices_window]

    prompt = (
        f"SOL/USDC prices (last {len(values)} hours, oldest→newest): {values}. "
        f"Strategy: {strategy}. "
        f"Technical: change={indicators['change_pct']}%, "
        f"SMA(6h)=${indicators['sma_short']}, SMA(full)=${indicators['sma_long']}, "
        f"volatility={indicators['volatility']}, range={indicators['range_pct']}%, "
        f"momentum={indicators['momentum']}%."
    )

    if extra_context:
        prompt += " " + extra_context

    prompt += " Analyze and return your trading decision as JSON."

    return prompt


def generate_examples():
    """Generate training examples from historical data."""
    prices, volumes = load_prices()
    tvl_data = load_tvl()
    protocols = load_protocols()

    examples = []
    window_size = 12  # 12 hours

    # Map TVL data to approximate dates for context
    tvl_by_date = {}
    for i, t in enumerate(tvl_data):
        date_key = t["ts"][:10]
        tvl_by_date[date_key] = t["tvl"]

    # Sliding window over price history
    for i in range(window_size, len(prices) - 1, 3):  # step by 3 for diversity
        window = prices[i - window_size:i]
        indicators = compute_indicators(window)

        if not indicators:
            continue

        # Determine TVL trend for context
        current_date = window[-1]["ts"][:10]
        tvl_now = tvl_by_date.get(current_date)
        prev_dates = sorted(tvl_by_date.keys())
        tvl_trend = None
        extra_ctx = ""

        if tvl_now:
            # Find TVL from ~7 days ago
            date_idx = prev_dates.index(current_date) if current_date in prev_dates else -1
            if date_idx > 7:
                tvl_prev = tvl_by_date.get(prev_dates[date_idx - 7])
                if tvl_prev and tvl_now > tvl_prev * 1.02:
                    tvl_trend = "growing"
                    extra_ctx = f"Solana ecosystem TVL: ${tvl_now/1e9:.1f}B (up from ${tvl_prev/1e9:.1f}B last week)."
                elif tvl_prev and tvl_now < tvl_prev * 0.98:
                    tvl_trend = "declining"
                    extra_ctx = f"Solana ecosystem TVL: ${tvl_now/1e9:.1f}B (down from ${tvl_prev/1e9:.1f}B last week)."
                else:
                    extra_ctx = f"Solana ecosystem TVL: ${tvl_now/1e9:.1f}B (stable)."

        # Add top protocol context randomly (30% of examples)
        if random.random() < 0.3 and protocols:
            top3 = protocols[:3]
            proto_ctx = "Top Solana DeFi: " + ", ".join(
                f"{p['name']} (${p['tvl']/1e6:.0f}M)" for p in top3 if p.get('tvl')
            ) + "."
            extra_ctx += " " + proto_ctx

        # Add network context randomly (20% of examples)
        if random.random() < 0.2:
            extra_ctx += f" Solana network TPS: ~{random.randint(2000, 5000)}, epoch {random.randint(500, 700)}."

        # Vary strategy
        strategy = random.choice(["conservative", "conservative", "aggressive"])

        decision = decide_label(indicators, tvl_trend)

        # For aggressive strategy: slightly shift thresholds
        if strategy == "aggressive":
            if decision["confidence"] > 0.4:
                decision["confidence"] = min(0.95, decision["confidence"] + 0.1)

        user_prompt = build_user_prompt(window, indicators, strategy, extra_ctx.strip())

        example = {
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
                {"role": "assistant", "content": json.dumps(decision)},
            ]
        }
        examples.append(example)

    return examples


if __name__ == "__main__":
    print("Generating training dataset...")

    examples = generate_examples()

    # Shuffle
    random.shuffle(examples)

    # Split: 90% train, 10% validation
    split = int(len(examples) * 0.9)
    train = examples[:split]
    val = examples[split:]

    # Write JSONL
    with open("training_data.jsonl", "w") as f:
        for ex in train:
            f.write(json.dumps(ex) + "\n")

    with open("validation_data.jsonl", "w") as f:
        for ex in val:
            f.write(json.dumps(ex) + "\n")

    print(f"Done! {len(train)} training + {len(val)} validation examples")
    print(f"Files: training_data.jsonl, validation_data.jsonl")

    # Stats
    actions = {"BUY": 0, "SELL": 0, "HOLD": 0}
    for ex in examples:
        d = json.loads(ex["messages"][2]["content"])
        actions[d["action"]] += 1
    print(f"Distribution: {actions}")

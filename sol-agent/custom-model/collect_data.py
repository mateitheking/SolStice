"""
Step 1: Collect Solana-specific data for training.

Sources:
  - CoinGecko: historical SOL price (hourly, 90 days)
  - DeFiLlama: Solana TVL history
  - Solana RPC: network stats (TPS, validators, epoch)
  - CryptoCompare: social/news sentiment

Output: raw_data/ folder with JSON files
"""

import os
import json
import time
from datetime import datetime, timezone
from pathlib import Path

import httpx

OUT_DIR = Path("raw_data")
OUT_DIR.mkdir(exist_ok=True)


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


# ============================================================
#  1. SOL PRICE HISTORY (CoinGecko — free, no key needed)
# ============================================================

def fetch_sol_price_history():
    """Fetch 90 days of hourly SOL/USD prices."""
    log("Fetching SOL price history (90 days, hourly)...")

    url = "https://api.coingecko.com/api/v3/coins/solana/market_chart"
    params = {"vs_currency": "usd", "days": "90", "interval": "hourly"}

    resp = httpx.get(url, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    prices = []
    for ts_ms, price in data["prices"]:
        prices.append({
            "ts": datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc).isoformat(),
            "price": round(price, 4),
        })

    # Also get volumes
    volumes = []
    for ts_ms, vol in data["total_volumes"]:
        volumes.append({
            "ts": datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc).isoformat(),
            "volume": round(vol, 2),
        })

    out = {"prices": prices, "volumes": volumes}
    (OUT_DIR / "sol_prices_90d.json").write_text(json.dumps(out, indent=2))
    log(f"  Saved {len(prices)} price points, {len(volumes)} volume points")
    return out


# ============================================================
#  2. SOLANA DEFI TVL (DeFiLlama — free, no key needed)
# ============================================================

def fetch_solana_tvl():
    """Fetch Solana chain TVL history from DeFiLlama."""
    log("Fetching Solana TVL history...")

    resp = httpx.get("https://api.llama.fi/v2/historicalChainTvl/Solana", timeout=30)
    resp.raise_for_status()
    data = resp.json()

    # Last 90 days
    tvl_data = []
    for point in data[-90*24:]:  # roughly 90 days if hourly, or 90 if daily
        tvl_data.append({
            "ts": datetime.fromtimestamp(point["date"], tz=timezone.utc).isoformat(),
            "tvl": round(point["tvl"], 2),
        })

    (OUT_DIR / "solana_tvl.json").write_text(json.dumps(tvl_data, indent=2))
    log(f"  Saved {len(tvl_data)} TVL points")
    return tvl_data


# ============================================================
#  3. SOLANA TOP PROTOCOLS (DeFiLlama)
# ============================================================

def fetch_solana_protocols():
    """Fetch top Solana DeFi protocols with TVL."""
    log("Fetching Solana DeFi protocols...")

    resp = httpx.get("https://api.llama.fi/protocols", timeout=30)
    resp.raise_for_status()
    protocols = resp.json()

    solana_protocols = []
    for p in protocols:
        chains = p.get("chains", [])
        if "Solana" in chains:
            solana_protocols.append({
                "name": p["name"],
                "category": p.get("category", ""),
                "tvl": p.get("tvl", 0),
                "change_1d": p.get("change_1d", 0),
                "change_7d": p.get("change_7d", 0),
            })

    solana_protocols.sort(key=lambda x: x["tvl"] or 0, reverse=True)
    solana_protocols = solana_protocols[:50]  # top 50

    (OUT_DIR / "solana_protocols.json").write_text(json.dumps(solana_protocols, indent=2))
    log(f"  Saved {len(solana_protocols)} Solana protocols")
    return solana_protocols


# ============================================================
#  4. SOLANA NETWORK STATS (Solana RPC — free)
# ============================================================

def fetch_solana_network_stats():
    """Fetch current Solana network performance data."""
    log("Fetching Solana network stats...")

    rpc_url = "https://api.devnet.solana.com"
    stats = {}

    # Performance samples (TPS)
    try:
        resp = httpx.post(rpc_url, json={
            "jsonrpc": "2.0", "id": 1,
            "method": "getRecentPerformanceSamples",
            "params": [10]
        }, timeout=15)
        samples = resp.json().get("result", [])
        if samples:
            avg_tps = sum(s["numTransactions"] / s["samplePeriodSecs"] for s in samples) / len(samples)
            stats["avg_tps"] = round(avg_tps, 2)
            stats["samples"] = len(samples)
    except Exception as e:
        log(f"  TPS fetch error: {e}")

    # Epoch info
    try:
        resp = httpx.post(rpc_url, json={
            "jsonrpc": "2.0", "id": 1,
            "method": "getEpochInfo"
        }, timeout=15)
        epoch = resp.json().get("result", {})
        stats["epoch"] = epoch.get("epoch", 0)
        stats["slot_index"] = epoch.get("slotIndex", 0)
        stats["slots_in_epoch"] = epoch.get("slotsInEpoch", 0)
    except Exception as e:
        log(f"  Epoch info error: {e}")

    (OUT_DIR / "solana_network.json").write_text(json.dumps(stats, indent=2))
    log(f"  Saved network stats: {stats}")
    return stats


# ============================================================
#  5. SOL MARKET DATA — extended (CoinGecko)
# ============================================================

def fetch_sol_market_data():
    """Fetch detailed market data for SOL."""
    log("Fetching SOL market data...")

    resp = httpx.get(
        "https://api.coingecko.com/api/v3/coins/solana",
        params={
            "localization": "false",
            "tickers": "false",
            "community_data": "true",
            "developer_data": "false",
        },
        timeout=30,
    )
    resp.raise_for_status()
    coin = resp.json()

    market = coin.get("market_data", {})
    data = {
        "price_usd": market.get("current_price", {}).get("usd"),
        "market_cap": market.get("market_cap", {}).get("usd"),
        "total_volume_24h": market.get("total_volume", {}).get("usd"),
        "price_change_24h_pct": market.get("price_change_percentage_24h"),
        "price_change_7d_pct": market.get("price_change_percentage_7d"),
        "price_change_30d_pct": market.get("price_change_percentage_30d"),
        "ath": market.get("ath", {}).get("usd"),
        "ath_change_pct": market.get("ath_change_percentage", {}).get("usd"),
        "circulating_supply": market.get("circulating_supply"),
        "total_supply": market.get("total_supply"),
        "max_supply": market.get("max_supply"),
        # Community
        "twitter_followers": coin.get("community_data", {}).get("twitter_followers"),
        "reddit_subscribers": coin.get("community_data", {}).get("reddit_subscribers"),
    }

    (OUT_DIR / "sol_market.json").write_text(json.dumps(data, indent=2))
    log(f"  Saved market data: price=${data['price_usd']}, mcap=${data['market_cap']}")
    return data


# ============================================================
#  MAIN
# ============================================================

if __name__ == "__main__":
    log("=== Collecting Solana training data ===\n")

    fetch_sol_price_history()
    time.sleep(2)  # rate limit

    fetch_solana_tvl()
    time.sleep(1)

    fetch_solana_protocols()
    time.sleep(2)

    fetch_solana_network_stats()
    time.sleep(1)

    fetch_sol_market_data()

    log("\n=== Done! Check raw_data/ folder ===")

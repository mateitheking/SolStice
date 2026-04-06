# SolStice — Autonomous On-Chain AI Trader

SolStice is an autonomous AI trading agent built on Solana. The agent analyzes real-time market data, makes BUY/SELL/HOLD decisions using multiple AI models, and records every decision on-chain via a smart contract — creating a fully verifiable, trustless trading history.

Built for the **National Solana Hackathon 2026**.

---

## How It Works

```
Market Data (CoinGecko, DeFiLlama)
        ↓
   AI Agent (Python)
   ├── Claude (Anthropic)
   ├── OpenAI GPT
   ├── SolStice Model (custom fine-tuned)
   └── Rule-based fallback
        ↓
  Confidence Score + SHA-256 Reasoning Hash
        ↓
   SDK Bridge (Node.js)
        ↓
  Solana Smart Contract (Anchor/Rust)
        ↓
   On-chain TradeEvent emitted
```

Every trade decision includes a **reasoning hash** — a SHA-256 fingerprint of the AI's explanation, price, and action — making the agent's logic verifiable on-chain.

---

## Repository Structure

```
├── sol-agent/              # AI Agent (Python + FastAPI)
│   ├── main.py             # Core agent logic, multi-model routing
│   ├── gui.html            # Local dashboard UI
│   ├── requirements.txt
│   ├── .env.example
│   ├── sdk-bridge/         # Node.js bridge → Solana contract
│   │   ├── index.js
│   │   └── solstice.json   # Program IDL
│   └── custom-model/       # SolStice fine-tuned model
│       ├── collect_data.py     # Fetch 90-day SOL market data
│       ├── generate_training.py # Generate training dataset
│       ├── train_local.py      # Fine-tune with LoRA (Phi-3.5)
│       ├── export_gguf.py      # Export to Ollama
│       └── Modelfile           # Ollama model definition
│
├── Smart-Contract/         # Anchor smart contract (Rust)
│   ├── programs/solstice/src/lib.rs
│   ├── sdk/sdk.ts          # TypeScript SDK
│   ├── tests/solstice.ts
│   └── Anchor.toml
│
└── Frontend/               # Mobile app (React Native + Expo)
    ├── app/screens/        # Dashboard, Wallet, AI Log, Strategy
    ├── app/services/       # Solana wallet & decision services
    └── app/components/
```

---

## Smart Contract

- **Program ID:** `H6KxmhVSn7GWEwXteNnoevcUayJUTALi2CuTmLE2RMjK`
- **Network:** Solana Devnet
- **Framework:** Anchor 0.30

### Instructions

| Instruction | Description |
|---|---|
| `initialize` | One-time setup, registers agent authority |
| `init_vault` | Creates vault PDA to hold user SOL |
| `deposit` | User deposits SOL into vault |
| `execute` | Agent records a trade decision on-chain |
| `set_strategy` | User sets Conservative or Aggressive strategy |
| `withdraw` | User withdraws SOL from vault |

### On-chain Events

- `DepositEvent` — user deposit recorded
- `TradeEvent` — AI decision: action, amount, price, reason, timestamp
- `WithdrawEvent` — user withdrawal recorded

---

## AI Agent

### Features

- **Multi-model routing** — Claude, OpenAI GPT, custom SolStice model, rule-based
- **Confidence scoring** — each decision rated 0.0–1.0
- **Reasoning hash** — SHA-256 of (reason + price + action), stored on-chain
- **Strategy-aware sizing** — Conservative: 0.1 SOL base / Aggressive: 0.2 SOL
- **Live dashboard** at `http://localhost:8000/gui`
- **REST API** for frontend integration

### Running the Agent

```bash
# 1. Install dependencies
cd sol-agent
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Fill in your API keys

# 3. Start SDK bridge
cd sdk-bridge
npm install
npm start

# 4. Start agent (new terminal)
cd sol-agent
python -m uvicorn main:app --reload
```

Open **http://localhost:8000/gui** to see the live dashboard.

### Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
DEFAULT_MODEL=claude          # claude | openai | custom | rule
INTERVAL_SECONDS=30
USER_PUBKEY=<your_wallet>
SDK_BRIDGE_URL=http://localhost:3001
```

### API Endpoints

| Endpoint | Description |
|---|---|
| `GET /status` | Current price, last action, model |
| `GET /decisions` | Full decision history |
| `POST /run-once` | Trigger a single decision |
| `POST /set-model` | Switch AI model |
| `POST /set-strategy` | Switch trading strategy |
| `GET /health` | Health check |

---

## Custom AI Model (SolStice Model)

A Solana-specialized language model fine-tuned on 90 days of SOL price history, DeFi TVL data, and network metrics.

```bash
# Step 1: Collect training data
cd sol-agent/custom-model
python collect_data.py

# Step 2: Generate training dataset
python generate_training.py

# Step 3: Fine-tune locally (requires GPU)
python train_local.py

# Step 4: Export to Ollama
python export_gguf.py
ollama create solstice-trader -f Modelfile
```

---

## Frontend

React Native app (Expo) with screens for Dashboard, AI Decision Log, Wallet, Strategy selection, and News.

```bash
cd Frontend
npm install
npx expo start
```

---

## Team

| Name | Role |
|---|---|
| Amir | AI/ML Engineer — Agent, custom model, SDK bridge |
| Nurali | Blockchain Engineer — Solana smart contract |
| Kuanysh | Frontend Engineer — React Native app |

---

## Tech Stack

- **Blockchain:** Solana, Anchor Framework, Rust
- **Agent:** Python, FastAPI, httpx, SQLite
- **AI Models:** Anthropic Claude, OpenAI GPT, Ollama (Phi-3.5 LoRA)
- **Bridge:** Node.js, Express, @coral-xyz/anchor
- **Frontend:** React Native, Expo, TypeScript, NativeWind
- **Data:** CoinGecko API, DeFiLlama API

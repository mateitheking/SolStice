# SolStice - Autonomous On-Chain AI Trader

SolStice is an autonomous AI trading agent built on Solana. The agent analyzes real-time market data, makes BUY/SELL/HOLD decisions using multiple AI models, and records every decision on-chain via a smart contract, creating a fully verifiable trading history.

Built for the **National Solana Hackathon 2026**.

---

## How It Works

```
Market Data (CoinGecko, DeFiLlama)
        |
   AI Agent (Python)
   |- Claude (Anthropic)
   |- OpenAI GPT
   |- SolStice Model (custom fine-tuned)
   |- Rule-based fallback
        |
  Confidence Score + SHA-256 Reasoning Hash
        |
   SDK Bridge (Node.js)
        |
  Solana Smart Contract (Anchor/Rust)
        |
   On-chain TradeEvent emitted
```

Every trade decision includes a **reasoning hash** - a SHA-256 fingerprint of the AI's explanation, price, and action - making the agent's logic verifiable on-chain.

---

## Repository Structure

```
├── sol-agent/              # AI Agent (Python + FastAPI)
│   ├── main.py             # Core agent logic, multi-model routing
│   ├── gui.html            # Local dashboard UI
│   ├── requirements.txt
│   ├── .env.example
│   ├── sdk-bridge/         # Node.js bridge to Solana contract
│   │   ├── index.js
│   │   └── solstice.json   # Program IDL
│   └── custom-model/       # SolStice fine-tuned model
│       ├── collect_data.py
│       ├── generate_training.py
│       ├── train_local.py
│       ├── export_gguf.py
│       └── Modelfile
│
├── Smart-Contract/         # Anchor smart contract (Rust)
│   ├── programs/solstice/src/lib.rs
│   ├── sdk/sdk.ts
│   ├── tests/solstice.ts
│   └── Anchor.toml
│
└── Frontend/               # Mobile app + web (React Native + Expo)
    ├── app/screens/        # Dashboard, Wallet, AI Log, Strategy, News
    ├── app/components/     # UI components incl. TrendChart, WhatWeDoSection
    ├── app/services/       # Solana wallet and decision services
    └── dist/               # Web build (deployable to Vercel/Netlify)
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

- `DepositEvent` - user deposit recorded
- `TradeEvent` - AI decision: action, amount, price, reason, timestamp
- `WithdrawEvent` - user withdrawal recorded

---

## AI Agent

### Features

- **Multi-model routing** - Claude, OpenAI GPT, custom SolStice model, rule-based
- **Confidence scoring** - each decision rated 0.0 to 1.0
- **Reasoning hash** - SHA-256 of (reason + price + action), stored on-chain
- **Strategy-aware sizing** - Conservative: 0.1 SOL base / Aggressive: 0.2 SOL
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
DEFAULT_MODEL=claude
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

## Custom AI Model

A Solana-specialized model fine-tuned on 90 days of SOL price history, DeFi TVL data, and network metrics.

```bash
cd sol-agent/custom-model

python collect_data.py        # fetch training data
python generate_training.py   # build dataset
python train_local.py         # fine-tune with LoRA (requires GPU)
python export_gguf.py         # export to Ollama format

ollama create solstice-trader -f Modelfile
```

---

## Frontend

React Native + Expo app that runs as both a **mobile app** and a **web app**.

Screens: Dashboard, AI Decision Log, Wallet, Strategy, News.

New in this version: `TrendChart` (smooth SVG price chart) and `WhatWeDoSection` (animated feature breakdown for the web landing page).

### Run locally

```bash
cd Frontend
npm install
npx expo start       # mobile (scan QR with Expo Go)
npx expo start --web # web browser
```

### Web build

```bash
npx expo export --platform web
# output goes to dist/ - deploy to Vercel or Netlify
```

---

## Team

| Name | Role |
|---|---|
| Amir | AI/ML Engineer - Agent, custom model, SDK bridge |
| Nurali | Blockchain Engineer - Solana smart contract |
| Kuanysh | Frontend Engineer - React Native app and web |

---

## Tech Stack

- **Blockchain:** Solana, Anchor Framework, Rust
- **Agent:** Python, FastAPI, SQLite
- **AI Models:** Anthropic Claude, OpenAI GPT, Ollama (Phi-3.5 LoRA)
- **Bridge:** Node.js, Express, @coral-xyz/anchor
- **Frontend:** React Native, Expo, TypeScript, NativeWind
- **Data:** CoinGecko API, DeFiLlama API

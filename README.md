# 🌞 SolStice

**Autonomous AI trading agent on Solana**
Analyzes real-time SOL prices, makes BUY / SELL / HOLD decisions via LLM, and executes them on-chain through an Anchor smart contract.

---

## 🚀 Overview

SolStice is a decentralized application built on **Solana** that enables:

* 🔗 Wallet connection via Phantom
* 💰 Depositing SOL into a program-controlled vault
* 🧠 Selecting an investment strategy
* 📊 Monitoring on-chain balances and vault state
* 📈 Tracking real-time SOL price via CoinGecko

The long-term vision is to evolve SolStice into a fully autonomous **AI-driven trading agent** that dynamically optimizes user yield based on market conditions.

---

## 📍 Checkpoint Status

* ✅ Anchor smart contract deployed on **Devnet**
* 🆔 **Program ID:**
  `9ad7ocUQqvMkee4URwVMvaLSxuEPiofb2UjR1hv4EgyN`
* 📱 Expo frontend integrated
* 🌐 Frontend reads live on-chain data
* 💲 SOL/USD price fetched via CoinGecko
* 👻 Phantom wallet connection available (web)
* 🔄 Deposit / Withdraw logic wired in frontend

---

## 🏗 Repository Structure

```
solstice/
│
├── programs/solstice   # Anchor smart contract
├── sdk/                # TypeScript SDK (PDA + helpers)
├── app/                # Expo / React Native frontend
│   └── app/
│       ├── services/
│       ├── providers/
│       ├── lib/
│       └── types/
│
├── tests/              # Anchor tests
├── Anchor.toml
└── README.md
```

---

## ⚙️ Smart Contract Instructions

* `initialize_program`
* `init_vault`
* `init_user`
* `deposit`
* `withdraw`
* `set_strategy`

---

## 🧠 Tech Stack

| Layer          | Tech                         |
| -------------- | ---------------------------- |
| Smart Contract | Rust, Anchor, Solana Devnet  |
| AI Agent       | Python, Claude API           |
| Frontend       | React / Expo, Phantom Wallet |
| Data           | CoinGecko API / Pyth Network |
| SDK            | TypeScript                   |

---

## ▶️ Getting Started

### Prerequisites

* Rust + Anchor
* Node.js 18+
* Phantom Wallet (Devnet mode)

---

### Installation

```bash
cd app
npm install --legacy-peer-deps
```

---

### Run Frontend

```bash
npx expo start
```

---

### Build Program (optional)

```bash
anchor build
```

---

### Deploy (already deployed)

```bash
anchor deploy
```

---

## 📊 Current Status

| Feature                   | Status         |
| ------------------------- | -------------- |
| Smart contract deployment | ✅ Done         |
| Wallet connection         | ✅ Working      |
| On-chain state reading    | ✅ Working      |
| Frontend integration      | ✅ Working      |
| Deposit                   | ⚠️ In progress |
| Withdraw                  | ⚠️ In progress |
| AI execution layer        | ⚠️ Prototype   |

---

## 👥 Team

| Name    | Role                     |
| ------- | ------------------------ |
| Nurali  | Solana / Smart Contracts |
| Amir    | AI / ML Agent            |
| Kuanysh | Frontend / React         |

---

## 💡 Vision

SolStice aims to become an autonomous DeFi agent that:

* Reacts to market conditions in real time
* Uses AI to select optimal strategies
* Executes trades directly on-chain
* Minimizes manual user interaction

---

## ⚠️ Notes

This project is a **hackathon checkpoint submission**.
Core architecture is implemented, while transaction execution (deposit/withdraw) is under active refinement.

---

## 📜 License

MIT

---

## 🔥 Built on Solana

Fast. Scalable. Autonomous.

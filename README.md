# SolStice

Autonomous AI trading agent on Solana. Analyzes real-time SOL prices, 
makes BUY/SELL/HOLD decisions via LLM, and executes them on-chain 
through an Anchor smart contract.

## Overview

Solstice is a prototype decentralized application built on **Solana** that allows users to:

- Connect their wallet (Phantom)
- Deposit SOL into a program-controlled vault
- Choose an investment strategy
- Monitor on-chain balances and vault state
- Track real-time SOL price (via CoinGecko)

The protocol is designed to evolve into an AI-powered trading agent that optimizes yield based on market conditions.

## Checkpoint status
- Anchor smart contract deployed on Devnet
- Current Program ID: `9ad7ocUQqvMkee4URwVMvaLSxuEPiofb2UjR1hv4EgyN`
- Expo frontend integrated into the repository
- Frontend reads live Devnet data and SOL/USD from CoinGecko
- Phantom wallet flow is available on web
- Deposit / withdraw transaction wiring is included in the frontend service layer

## Repository structure
- `programs/solstice` — Anchor smart contract
- `sdk/` — shared TypeScript SDK helpers and PDA utilities
- `app/` — Expo / React Native frontend
- `tests/` — Anchor tests

## Smart contract instructions
- `initialize_program`
- `init_vault`
- `init_user`
- `deposit`
- `withdraw`
- `set_strategy`

## Tech Stack

| Layer | Tech |
|-------|------|
| Smart Contract | Rust, Anchor, Solana Devnet |
| AI Agent | Python, Claude API |
| Frontend | React, Phantom Wallet, Tailwind CSS |
| Data | CoinGecko API / Pyth Network |

## Project Structure
```
solstice/
│
├── programs/ # Anchor smart contract
├── sdk/ # TypeScript SDK (on-chain interaction)
├── app/ # React Native (Expo) frontend
│ └── app/
│ ├── services/
│ ├── providers/
│ ├── lib/
│ └── types/
│
├── Anchor.toml
└── README.md
```
## Getting Started

### Prerequisites
- Rust + Anchor
- Node.js 18+
- Phantom Wallet (set to Devnet)

### Installation
1. Install dependencies

bash
cd app
npm install --legacy-peer-deps

2. Run frontend
npx expo start

3. Build program (optional)
anchor build

4. Deploy (already deployed)
anchor deploy

## ⚙️ Tech Stack

- **Solana / Anchor** — smart contract
- **TypeScript SDK** — on-chain interaction layer
- **React Native (Expo)** — frontend mobile dApp
- **Phantom Wallet** — user authentication
- **CoinGecko API** — price data

## Our team

| Name | Role |
|------|------|
| Nurali | Solana / Smart Contract |
| Amir | AI / ML Agent |
| Kuanysh | Frontend / React |

## Current status
- Solana program deployed on Devnet
- Wallet connection implemented
- Program/account state reading works
- Frontend integrated with deployed contract
- Deposit/withdraw transaction flow is currently under active refinement

## License

MIT

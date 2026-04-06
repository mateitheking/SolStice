# SolStice Custom Model — Solana-Specialized AI Trader

## Architecture

```
┌─────────────────────────────────────────────┐
│              SolStice Model                 │
│                                             │
│  ┌─────────────┐    ┌───────────────────┐   │
│  │  Fine-tuned  │    │  Real-time Solana │   │
│  │  GPT-4o-mini │ +  │  Context (RAG)    │   │
│  │  (on Solana  │    │  - On-chain data  │   │
│  │   trading)   │    │  - News/sentiment │   │
│  └─────────────┘    │  - DeFi metrics   │   │
│                      └───────────────────┘   │
└─────────────────────────────────────────────┘
```

## Step 1: Collect training data
Run: `python collect_data.py`

## Step 2: Generate training dataset
Run: `python generate_training.py`

## Step 3: Fine-tune on OpenAI
Run: `python finetune.py`

## Step 4: Integrate into agent
Update .env: `CUSTOM_MODEL_ID=ft:gpt-4o-mini-2024-07-18:...`

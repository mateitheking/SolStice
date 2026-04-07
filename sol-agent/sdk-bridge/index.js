// SDK Bridge — HTTP wrapper around the Solana program.
// The Python agent posts to /execute and this server signs + submits the tx.

const express = require("express");
const { Connection, PublicKey, Keypair } = require("@solana/web3.js");
const anchor = require("@coral-xyz/anchor");
const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const PORT = parseInt(process.env.PORT || "3001");
const KEYPAIR_PATH = process.env.AGENT_KEYPAIR_PATH || path.join(__dirname, "agent-keypair.json");
const IDL_PATH = process.env.IDL_PATH || path.join(__dirname, "solstice.json");

const PROGRAM_ID_STR = process.env.PROGRAM_ID || "yRxrK31ibWBXorgH1g1VVXmDzZotzVhv3AudE48W44f";
const PROGRAM_ID = new PublicKey(PROGRAM_ID_STR);

// PDA seeds — must match lib.rs exactly
const VAULT_SEED = Buffer.from("vault");
const USER_STATE_SEED = Buffer.from("user_state");
const CONFIG_SEED = Buffer.from("config");

const RPC_ENDPOINTS = [
  "https://solana-devnet.g.alchemy.com/v2/_MTQNzqh7r7HUKoRcEUdM",
  "https://api.devnet.solana.com",
  "https://rpc.ankr.com/solana_devnet",
];

let agentKeypair;
let idl;
let connection;

function loadKeypair() {
  if (!fs.existsSync(KEYPAIR_PATH)) {
    console.log(`Keypair not found at ${KEYPAIR_PATH}, generating new one...`);
    const kp = Keypair.generate();
    fs.writeFileSync(KEYPAIR_PATH, JSON.stringify(Array.from(kp.secretKey)));
    console.log(`Agent public key: ${kp.publicKey.toBase58()}`);
    console.log("Fund this address on Devnet:");
    console.log(`  solana airdrop 2 ${kp.publicKey.toBase58()} --url devnet`);
    return kp;
  }
  const raw = JSON.parse(fs.readFileSync(KEYPAIR_PATH, "utf-8"));
  const kp = Keypair.fromSecretKey(Uint8Array.from(raw));
  console.log(`Agent public key: ${kp.publicKey.toBase58()}`);
  return kp;
}

function loadIDL() {
  if (!fs.existsSync(IDL_PATH)) {
    console.warn(`IDL not found at ${IDL_PATH}. Bridge will run in MOCK mode.`);
    return null;
  }
  const loaded = JSON.parse(fs.readFileSync(IDL_PATH, "utf-8"));
  console.log(`IDL loaded: ${loaded.metadata.name} v${loaded.metadata.version}`);
  console.log(`Instructions: ${loaded.instructions.map(i => i.name).join(", ")}`);
  return loaded;
}

async function getConnection() {
  for (const url of RPC_ENDPOINTS) {
    try {
      const conn = new Connection(url, "confirmed");
      await conn.getSlot();
      console.log("RPC connected:", url);
      return conn;
    } catch {
      console.log("RPC failed:", url);
    }
  }
  throw new Error("All RPC endpoints failed");
}

function getProgram(walletKeypair) {
  if (!idl || !connection) return null;
  const wallet = new anchor.Wallet(walletKeypair || agentKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  return new anchor.Program(idl, PROGRAM_ID, provider);
}

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  const hasExecute = idl ? idl.instructions.some(i => i.name === "execute") : false;
  res.json({
    ok: true,
    agent_pubkey: agentKeypair.publicKey.toBase58(),
    idl_loaded: idl !== null,
    program_id: PROGRAM_ID_STR,
    has_execute: hasExecute,
    instructions: idl ? idl.instructions.map(i => i.name) : [],
  });
});

app.post("/execute", async (req, res) => {
  const { action, amountSOL, priceUSD, reason, userPubkey } = req.body;

  if (!action || !userPubkey) {
    return res.status(400).json({ error: "action and userPubkey required" });
  }

  // If the contract doesn't have execute yet, log the decision and return a mock hash
  if (!idl || !idl.instructions.some(i => i.name === "execute")) {
    console.log(`[MOCK] execute(${action}, ${amountSOL} SOL, $${priceUSD})`);
    console.log(`[MOCK] reason: ${reason}`);
    return res.json({
      txHash: `mock_${Date.now().toString(36)}_${action}`,
      mock: true,
      message: "execute instruction not in contract — decision logged off-chain only",
    });
  }

  try {
    const program = getProgram();
    const user = new PublicKey(userPubkey);

    const [userStatePDA] = PublicKey.findProgramAddressSync(
      [USER_STATE_SEED, user.toBuffer()],
      PROGRAM_ID
    );
    const [configPDA] = PublicKey.findProgramAddressSync(
      [CONFIG_SEED],
      PROGRAM_ID
    );

    const actionNum = action === "buy" ? 0 : action === "sell" ? 1 : 2;
    const lamports = new anchor.BN(Math.round((amountSOL || 0.1) * 1e9));
    const priceCents = new anchor.BN(Math.round((priceUSD || 0) * 100));
    const trimmedReason = (reason || "").slice(0, 200);

    const tx = await program.methods
      .execute(user, actionNum, lamports, priceCents, trimmedReason)
      .accounts({
        userState: userStatePDA,
        config: configPDA,
        agent: agentKeypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log(`[ON-CHAIN] ${action.toUpperCase()} tx: ${tx}`);
    res.json({ txHash: tx, mock: false });
  } catch (err) {
    console.error("[ON-CHAIN] execute error:", err.message);
    res.status(500).json({ error: err.message, txHash: "" });
  }
});

app.get("/user-state", async (req, res) => {
  const { pubkey } = req.query;
  if (!pubkey) return res.status(400).json({ error: "pubkey query param required" });

  if (!idl || !connection) {
    return res.json({ mock: true, balance: 0, strategy: "Hold" });
  }

  try {
    const program = getProgram();
    const user = new PublicKey(pubkey);
    const [userStatePDA] = PublicKey.findProgramAddressSync(
      [USER_STATE_SEED, user.toBuffer()],
      PROGRAM_ID
    );

    const state = await program.account.userState.fetch(userStatePDA);
    res.json({
      mock: false,
      owner: state.owner.toBase58(),
      balance: state.balance.toNumber() / 1e9,
      strategy: Object.keys(state.strategy)[0],
    });
  } catch (err) {
    res.json({ mock: false, balance: 0, strategy: "unknown", error: err.message });
  }
});

app.post("/set-strategy", async (req, res) => {
  if (!idl || !connection) {
    return res.json({ mock: true, message: "No IDL/connection" });
  }

  // set_strategy requires the user's wallet signature — call this from the frontend directly
  res.json({
    mock: true,
    message: "set_strategy must be called from frontend (requires user wallet signature)",
  });
});

async function main() {
  agentKeypair = loadKeypair();
  idl = loadIDL();

  try {
    connection = await getConnection();
  } catch (e) {
    console.warn("No RPC connection:", e.message);
  }

  app.listen(PORT, () => {
    console.log(`\nSDK Bridge running on http://localhost:${PORT}`);
    if (idl && !idl.instructions.some(i => i.name === "execute")) {
      console.log("\n⚠️  WARNING: Contract has no 'execute' instruction!");
      console.log("   Available: " + idl.instructions.map(i => i.name).join(", "));
      console.log("   Agent trades will be logged off-chain until execute() is deployed.\n");
    }
  });
}

main().catch(console.error);

const {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} = require("@solana/web3.js");
const fs = require("fs");
const crypto = require("crypto");

const PROGRAM_ID = new PublicKey("yRxrK31ibWBXorgH1g1VVXmDzZotzVhv3AudE48W44f");
const RPC_URL = "https://api.devnet.solana.com";
const WALLET_PATH = "/Users/nurali/.config/solana/id.json";

const connection = new Connection(RPC_URL, "confirmed");

const secret = Uint8Array.from(JSON.parse(fs.readFileSync(WALLET_PATH, "utf8")));
const admin = Keypair.fromSecretKey(secret);

function discriminator(name) {
  return crypto.createHash("sha256").update(`global:${name}`).digest().subarray(0, 8);
}

function getConfigPda() {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID)[0];
}

function getVaultPda() {
  return PublicKey.findProgramAddressSync([Buffer.from("vault")], PROGRAM_ID)[0];
}

async function sendIx(ix, label) {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({
    feePayer: admin.publicKey,
    recentBlockhash: blockhash,
  }).add(ix);

  const sig = await sendAndConfirmTransaction(connection, tx, [admin], {
    commitment: "confirmed",
  });

  console.log(`${label} done:`, sig);
  return sig;
}

async function main() {
  const configPda = getConfigPda();
  const vaultPda = getVaultPda();

  const [configInfo, vaultInfo] = await Promise.all([
    connection.getAccountInfo(configPda),
    connection.getAccountInfo(vaultPda),
  ]);

  if (!configInfo) {
    console.log("calling initialize...");
    const ix = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: configPda, isSigner: false, isWritable: true },
        { pubkey: admin.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: discriminator("initialize"),
    });
    await sendIx(ix, "initialize");
  } else {
    console.log("config already exists, skipping initialize");
  }

  if (!vaultInfo) {
    console.log("calling init_vault...");
    const ix = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: admin.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: discriminator("init_vault"),
    });
    await sendIx(ix, "init_vault");
  } else {
    console.log("vault already exists, skipping init_vault");
  }

  console.log("done");
  console.log("config PDA:", configPda.toBase58());
  console.log("vault PDA:", vaultPda.toBase58());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
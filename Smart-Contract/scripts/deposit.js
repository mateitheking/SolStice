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
const user = Keypair.fromSecretKey(secret);

function discriminator(name) {
  return crypto.createHash("sha256").update(`global:${name}`).digest().subarray(0, 8);
}

function getVaultPda() {
  return PublicKey.findProgramAddressSync([Buffer.from("vault")], PROGRAM_ID)[0];
}

function getUserStatePda() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user_state"), user.publicKey.toBuffer()],
    PROGRAM_ID
  )[0];
}

async function main() {
  const vaultPda = getVaultPda();
  const userStatePda = getUserStatePda();

  console.log("vault:", vaultPda.toBase58());
  console.log("userState:", userStatePda.toBase58());

  // 0.001 SOL
  const amount = BigInt(1_000_000); // lamports

  const data = Buffer.concat([
    discriminator("deposit"),
    Buffer.from(new Uint8Array(new BigUint64Array([amount]).buffer)),
  ]);

  const ix = new TransactionInstruction({
  programId: PROGRAM_ID,
  keys: [
    { pubkey: vaultPda, isSigner: false, isWritable: true },
    { pubkey: userStatePda, isSigner: false, isWritable: true },
    { pubkey: user.publicKey, isSigner: true, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ],
  data,
});

  const tx = new Transaction().add(ix);

  const sig = await sendAndConfirmTransaction(connection, tx, [user]);
  console.log("deposit done:", sig);
}

main().catch(console.error);
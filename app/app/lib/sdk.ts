import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import idl from "./solstice.json";

export const PROGRAM_ID = new PublicKey("9ad7ocUQqvMkee4URwVMvaLSxuEPiofb2UjR1hv4EgyN");
export const DEVNET_RPC = clusterApiUrl("devnet");

const encoder = new TextEncoder();

export const SEEDS = {
  config: encoder.encode("config"),
  vault: encoder.encode("vault"),
  user: encoder.encode("user"),
};

export const SOLSTICE_IDL = idl;

export type StrategyName = "Hold" | "Aggressive" | "Conservative";

export type ProgramConfigDecoded = {
  owner: string;
  agent: string;
};

export type VaultDecoded = {
  bump: number;
};

export type UserStateDecoded = {
  owner: string;
  balanceLamports: bigint;
  balanceSol: number;
  strategy: StrategyName;
};

export function getConnection() {
  return new Connection(DEVNET_RPC, "confirmed");
}

export function getConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.config], PROGRAM_ID);
}

export function getVaultPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.vault], PROGRAM_ID);
}

export function getUserStatePDA(userPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.user, userPubkey.toBytes()], PROGRAM_ID);
}

export function getExplorerProgramUrl(): string {
  return `https://explorer.solana.com/address/${PROGRAM_ID.toBase58()}?cluster=devnet`;
}

export function getExplorerAddressUrl(address: string): string {
  return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}

export function lamportsToSol(value: bigint): number {
  return Number(value) / 1_000_000_000;
}

export async function getSolPriceUsd(): Promise<number | null> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
    );
    const data = await response.json();
    return data?.solana?.usd ?? null;
  } catch {
    return null;
  }
}

function readPubkey(bytes: Uint8Array, offset: number): string {
  return new PublicKey(bytes.slice(offset, offset + 32)).toBase58();
}

function readU64(bytes: Uint8Array, offset: number): bigint {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return view.getBigUint64(offset, true);
}

function decodeStrategy(byte: number): StrategyName {
  switch (byte) {
    case 0:
      return "Hold";
    case 1:
      return "Aggressive";
    case 2:
      return "Conservative";
    default:
      return "Hold";
  }
}

export function decodeProgramConfig(data: Uint8Array): ProgramConfigDecoded {
  return {
    owner: readPubkey(data, 8),
    agent: readPubkey(data, 40),
  };
}

export function decodeVault(data: Uint8Array): VaultDecoded {
  return {
    bump: data[8] ?? 0,
  };
}

export function decodeUserState(data: Uint8Array): UserStateDecoded {
  const balanceLamports = readU64(data, 40);
  const strategyByte = data[48] ?? 0;
  return {
    owner: readPubkey(data, 8),
    balanceLamports,
    balanceSol: lamportsToSol(balanceLamports),
    strategy: decodeStrategy(strategyByte),
  };
}

export async function fetchProgramSnapshot(connection: Connection) {
  const [configPda] = getConfigPDA();
  const [vaultPda] = getVaultPDA();

  const [slot, configAccount, vaultAccount, programBalance] = await Promise.all([
    connection.getSlot(),
    connection.getAccountInfo(configPda),
    connection.getAccountInfo(vaultPda),
    connection.getBalance(PROGRAM_ID),
  ]);

  return {
    slot,
    programBalanceLamports: programBalance,
    configPda: configPda.toBase58(),
    vaultPda: vaultPda.toBase58(),
    configExists: Boolean(configAccount),
    vaultExists: Boolean(vaultAccount),
    config: configAccount ? decodeProgramConfig(configAccount.data) : null,
    vault: vaultAccount ? decodeVault(vaultAccount.data) : null,
    vaultLamports: vaultAccount ? vaultAccount.lamports : 0,
  };
}

export async function fetchUserState(connection: Connection, walletAddress: string) {
  const pubkey = new PublicKey(walletAddress);
  const [userStatePda] = getUserStatePDA(pubkey);
  const account = await connection.getAccountInfo(userStatePda);

  return {
    walletAddress,
    userStatePda: userStatePda.toBase58(),
    exists: Boolean(account),
    userState: account ? decodeUserState(account.data) : null,
  };
}

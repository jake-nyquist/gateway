// types.ts
export interface AssetList {
  base: string;
}

export interface ExtendedPool {
  $typeUrl?: string;
  poolAssets?: { token: { denom: string } }[];
  token0?: string;
  token1?: string;
  id?: string;
  totalShares?: { denom: string };
}

export interface PriceHash {
  [key: string]: number;
}

export interface ExtendPoolProps {
  pool: ExtendedPool;
  fees: any[];
  balances: any[];
  lockedCoins: any[];
  prices: PriceHash;
}

// main.ts
import { BigNumber } from 'bignumber.js';
import { calcPoolLiquidity } from './calcPoolLiquidity';
import { convertGammTokenToDollarValue } from './convertGammTokenToDollarValue'; // Import the function
import type { AssetList, ExtendedPool, PriceHash, ExtendPoolProps } from './types';

export const filterPoolsSwapAndLP = (assets: AssetList[], pools: ExtendedPool[], prices: PriceHash): ExtendedPool[] => {
  let poolsOut = pools.filter(({ $typeUrl }: ExtendedPool) => !$typeUrl?.includes('stableswap'));

  poolsOut = poolsOut.filter((pool: ExtendedPool) => {
    if (pool.poolAssets) {
      return pool.poolAssets.every(
        (pAsset: { token: { denom: string } }) =>
          prices[pAsset.token.denom] &&
          !pAsset.token.denom.startsWith('gamm/pool') &&
          assets.find(({ base }: AssetList) => base === pAsset.token.denom)
      );
    } else if (pool.token0 && pool.token1) {
      return (
        prices[pool.token0] &&
        prices[pool.token1] &&
        assets.find(({ base }: AssetList) => base === pool.token0) &&
        assets.find(({ base }: AssetList) => base === pool.token1)
      );
    }
    return false;
  });

  return poolsOut;
};

export const extendPool = (assets: AssetList[], { pool, fees, balances, lockedCoins, prices }: ExtendPoolProps): ExtendedPool => {
  let liquidity = 0;
  if (pool.poolAssets) {
    liquidity = new BigNumber(calcPoolLiquidity(assets, pool, prices))
      .decimalPlaces(0)
      .toNumber();
  }

  let volume24H = 0;
  let volume7d = 0;
  let fees7D = 0;
  if (fees) {
    const feeData = fees.find((fee: any) => fee.pool_id === pool.id.toString());
    volume24H = Math.round(Number(feeData?.volume_24h || 0));
    volume7d = Math.round(Number(feeData?.volume_7d || 0));
    fees7D = Math.round(Number(feeData?.fees_spent_7d || 0));
  }

  let poolDenom = '';
  if (pool.totalShares) {
    poolDenom = pool.totalShares.denom;
  }

  const balanceCoin = balances.find(({ denom }: any) => denom === poolDenom);
  const myLiquidity = balanceCoin
    ? convertGammTokenToDollarValue(assets, balanceCoin, pool, prices)
    : '0';

  const lockedCoin = lockedCoins.find(({ denom }: any) => denom === poolDenom);
  const bonded = lockedCoin
    ? convertGammTokenToDollarValue(assets, lockedCoin, pool, prices)
    : '0';

  return {
    ...pool,
    liquidity,
    volume24H,
    fees7D,
    volume7d,
    myLiquidity,
    bonded,
    denom: poolDenom,
  };
};

export const filterPoolsLP = (assets: AssetList[], pools: ExtendedPool[], prices: PriceHash): ExtendedPool[] => {
  let poolsOut = pools.filter(({ $typeUrl }: ExtendedPool) => $typeUrl?.includes('concentratedliquidity'));
  poolsOut = poolsOut.filter((pool: ExtendedPool) =>
    prices[pool.token0!] &&
    prices[pool.token1!] &&
    assets.find(({ base }: AssetList) => base === pool.token0!) &&
    assets.find(({ base }: AssetList) => base === pool.token1!)
  );
  return poolsOut;
};

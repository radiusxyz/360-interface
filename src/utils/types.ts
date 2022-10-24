/* eslint-disable prettier/prettier */
import { Protocol } from '@uniswap/router-sdk'
import { TradeType } from '@uniswap/sdk-core'
import { CurrencyAmount, IGasModel, IV2PoolProvider, IV3PoolProvider } from '@uniswap/smart-order-router'
import { Route as V2RouteRaw } from '@uniswap/v2-sdk'
import { Route as V3RouteRaw } from '@uniswap/v3-sdk'
import { BigNumber } from 'ethers/lib/ethers'
import { TokenWithId } from 'state/routing/types'

export declare class V3Route extends V3RouteRaw<TokenWithId, TokenWithId> {}

export declare class V2Route extends V2RouteRaw<TokenWithId, TokenWithId> {}

export interface IRouteWithValidQuote<Route extends V3Route | V2Route> {
  amount: CurrencyAmount
  percent: number
  quoteAdjustedForGas: CurrencyAmount
  quote: CurrencyAmount
  route: Route
  gasEstimate: BigNumber
  gasCostInToken: CurrencyAmount
  gasCostInUSD: CurrencyAmount
  tradeType: TradeType
  poolAddresses: string[]
  tokenPath: TokenWithId[]
}
export declare type IV2RouteWithValidQuote = {
  protocol: Protocol.V2
} & IRouteWithValidQuote<V2Route>
export declare type IV3RouteWithValidQuote = {
  protocol: Protocol.V3
} & IRouteWithValidQuote<V3Route>
export declare type RouteWithValidQuote = V2RouteWithValidQuote | V3RouteWithValidQuote
export declare type V2RouteWithValidQuoteParams = {
  amount: CurrencyAmount
  rawQuote: BigNumber
  percent: number
  route: V2Route
  gasModel: IGasModel<V2RouteWithValidQuote>
  quoteToken: TokenWithId
  tradeType: TradeType
  v2PoolProvider: IV2PoolProvider
}
/**
 * Represents a quote for swapping on a V2 only route. Contains all information
 * such as the route used, the amount specified by the user, the type of quote
 * (exact in or exact out), the quote itself, and gas estimates.
 *
 * @export
 * @class V2RouteWithValidQuote
 */
export declare class V2RouteWithValidQuote implements IV2RouteWithValidQuote {
  readonly protocol = Protocol.V2
  amount: CurrencyAmount
  rawQuote: BigNumber
  quote: CurrencyAmount
  quoteAdjustedForGas: CurrencyAmount
  percent: number
  route: V2Route
  quoteToken: TokenWithId
  gasModel: IGasModel<V2RouteWithValidQuote>
  gasEstimate: BigNumber
  gasCostInToken: CurrencyAmount
  gasCostInUSD: CurrencyAmount
  tradeType: TradeType
  poolAddresses: string[]
  tokenPath: TokenWithId[]
  toString(): string
  constructor({
    amount,
    rawQuote,
    percent,
    route,
    gasModel,
    quoteToken,
    tradeType,
    v2PoolProvider,
  }: V2RouteWithValidQuoteParams)
}
export declare type V3RouteWithValidQuoteParams = {
  amount: CurrencyAmount
  rawQuote: BigNumber
  sqrtPriceX96AfterList: BigNumber[]
  initializedTicksCrossedList: number[]
  quoterGasEstimate: BigNumber
  percent: number
  route: V3Route
  gasModel: IGasModel<V3RouteWithValidQuote>
  quoteToken: TokenWithId
  tradeType: TradeType
  v3PoolProvider: IV3PoolProvider
}

export declare class V3RouteWithValidQuote implements IV3RouteWithValidQuote {
  readonly protocol = Protocol.V3
  amount: CurrencyAmount
  rawQuote: BigNumber
  quote: CurrencyAmount
  quoteAdjustedForGas: CurrencyAmount
  sqrtPriceX96AfterList: BigNumber[]
  initializedTicksCrossedList: number[]
  quoterGasEstimate: BigNumber
  percent: number
  route: V3Route
  quoteToken: TokenWithId
  gasModel: IGasModel<V3RouteWithValidQuote>
  gasEstimate: BigNumber
  gasCostInToken: CurrencyAmount
  gasCostInUSD: CurrencyAmount
  tradeType: TradeType
  poolAddresses: string[]
  tokenPath: TokenWithId[]
  toString(): string
  constructor({
    amount,
    rawQuote,
    sqrtPriceX96AfterList,
    initializedTicksCrossedList,
    quoterGasEstimate,
    percent,
    route,
    gasModel,
    quoteToken,
    tradeType,
    v3PoolProvider,
  }: V3RouteWithValidQuoteParams)
}

import { Balance, BalanceInUSD, Wrapper } from './TokenAmountStyles'

type Props = { balance: number; balanceInUSD: number }

const TokenAmount: React.FC<Props> = (props: Props) => {
  return (
    <Wrapper>
      <Balance>{props.balance}</Balance>
      <BalanceInUSD>{props.balanceInUSD}</BalanceInUSD>
    </Wrapper>
  )
}

export default TokenAmount

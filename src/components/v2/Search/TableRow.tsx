import { Description, DetailsWrapper, Title, Wrapper } from './TableRowStyles'
import TokenAmount from './TokenAmount'
import CurrencyLogo from '../../../components/CurrencyLogo/index'
// import { Token } from '../../../assets/v2/data'

type Props = { token: any }

const TableRow: React.FC<Props> = ({ token }: Props) => {
  if (token.symbol === '4INT') console.log(token)

  return (
    <Wrapper>
      <DetailsWrapper>
        <CurrencyLogo currency={token} size={'23px'} />
        <Title>{token.symbol}</Title>
        <Description>{token.name}</Description>
      </DetailsWrapper>
      <TokenAmount balance={token.balance} balanceInUSD={token.balanceInUSD} />
    </Wrapper>
  )
}

export default TableRow

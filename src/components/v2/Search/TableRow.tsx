import { Wrapper } from './TableRowStyles'
import TokenAmount from './TokenAmount'
import { Token } from '../../../assets/v2/data'
import EnhancedTokenDescription from './EnhancedTokenDescription'

type Props = { token: Token }

const TableRow: React.FC<Props> = ({ token }: Props) => {
  return (
    <Wrapper>
      <EnhancedTokenDescription title={token.title} description={token.description} />
      <TokenAmount balance={token.balance} balanceInUSD={token.balanceInUSD} />
    </Wrapper>
  )
}

export default TableRow

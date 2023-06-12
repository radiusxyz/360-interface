import React from 'react'
import TableRow from './TableRow'
import { Tokens } from '../../../assets/v2/data'
import { Wrapper } from './TableStyles'
import cuid from 'cuid'

type Props = { tokens: Tokens }

const Table: React.FC<Props> = (props: Props) => {
  return (
    <Wrapper>
      {props.tokens.map((token) => (
        <TableRow key={cuid()} token={token} />
      ))}
    </Wrapper>
  )
}

export default Table

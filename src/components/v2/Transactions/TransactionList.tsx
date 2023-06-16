import styled from 'styled-components/macro'
import cuid from 'cuid'
import expand from '../../../assets/v2/images/expand.svg'
import { useState } from 'react'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
`

const TX = styled.div`
  display: flex;
  padding: 17px 29px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: #ffffff;
  border: 1px solid #dde0ff;
  box-shadow: 0px 4px 21px rgba(90, 18, 61, 0.1);
  border-radius: 4px;
`

const TXDetails = styled.div`
  display: flex;
  gap: 26px;
  align-items: center;
  width: 100%;
`

const TXStatus = styled.div<{ status: string }>`
  display: flex;
  justify-content: center;
  align-items: center;
  background: #eae7ff;
  border-radius: 23px;
  max-width: 99px;
  height: 23px;
  width: 100%;
  font-weight: 500;
  font-size: 14px;
  line-height: 92.08%;
  background: ${({ status }) =>
    (status === 'Pending' && '#EAE7FF') || (status === 'Completed' && '#E0FFE5') || (status === 'Failed' && '#FFE0E0')};
  color: ${({ status }) =>
    (status === 'Pending' && '#6B11FF') || (status === 'Completed' && '#00BF63') || (status === 'Failed' && '#FF4444')};
`

const TXDateTimeAndAmount = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const TXDateTime = styled.span`
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: #6b6b6b;
`

const TXAmount = styled.span`
  display: flex;
  align-items: center;
  gap: 16px;
  font-weight: 400;
  font-size: 16px;
  line-height: 19px;
  text-align: center;
  color: #000000;
`

const Dash = styled.span`
  color: #6d6d6d;
`

export const Expand = styled.img.attrs({
  src: expand,
})<{ rotate: boolean }>`
  transform: ${({ rotate }) => rotate && 'rotate(180deg)'};
`

const data = [
  {
    status: 'Pending',
    date: '18 April 2023 - 5:18 PM',
    from: '0.001 WMATIC',
    to: '0.000000557497 ETH',
  },
  {
    status: 'Failed',
    date: '18 April 2023 - 5:18 PM',
    from: '0.001 WMATIC',
    to: '0.000000557497 ETH',
  },
  {
    status: 'Completed',
    date: '18 April 2023 - 5:18 PM',
    from: '0.001 WMATIC',
    to: '0.000000557497 ETH',
  },
  {
    status: 'Completed',
    date: '18 April 2023 - 5:18 PM',
    from: '0.001 WMATIC',
    to: '0.000000557497 ETH',
  },
  {
    status: 'Pending',
    date: '18 April 2023 - 5:18 PM',
    from: '0.001 WMATIC',
    to: '0.000000557497 ETH',
  },
]

const TransactionList = () => {
  const [expand, setExpand] = useState(false)
  const handleExpand = () => {
    setExpand((expand: boolean) => !expand)
  }
  return (
    <Wrapper>
      {data.map((tx) => (
        <TX key={cuid()}>
          <TXDetails>
            <TXStatus status={tx.status}>{tx.status}</TXStatus>
            <TXDateTimeAndAmount>
              <TXDateTime>{tx.date}</TXDateTime>
              <TXAmount>
                {tx.from} <Dash>&mdash;&mdash;</Dash> {tx.to}
              </TXAmount>
            </TXDateTimeAndAmount>
          </TXDetails>
          <Expand rotate={expand} onClick={handleExpand} />
        </TX>
      ))}
    </Wrapper>
  )
}

export default TransactionList

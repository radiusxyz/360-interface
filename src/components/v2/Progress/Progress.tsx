import StraightProgress from '../Transactions/StraightProgress'
import { CurvedProgress } from './CurvedProgress'
import { useEffect, useState } from 'react'

type Props = { page?: string }

const Progress = ({ page }: Props) => {
  const [percentage, setPercentage] = useState(0)
  useEffect(() => {
    if (percentage > 99) return
    const identifier = setInterval(() => {
      setPercentage((percentage) => percentage + 1)
    }, 100)
    return () => {
      clearInterval(identifier)
    }
  }, [percentage])

  return (
    (page === 'history' && <StraightProgress percentage={percentage} />) || <CurvedProgress percentage={percentage} />
  )
}

export default Progress

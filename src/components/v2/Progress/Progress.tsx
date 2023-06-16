import { ProgressBar } from './ProgressBar'
import { useEffect, useState } from 'react'
import { Body, Button, Description, Explanation, Head, Info, Note, Wrapper } from './ProgressStyles'

const Progress = () => {
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
    <Wrapper>
      <Head>
        <Info>
          <Description>Ready to go! Transaction in progress.</Description>
          <Explanation>You can go do other things now! Your swap is still being processed.</Explanation>
        </Info>
        <Button>New Swap</Button>
      </Head>
      <Body>
        <ProgressBar percentage={percentage} />

        {(percentage === 100 && <Note>Your wallet is getting heavier!</Note>) ||
          (percentage >= 50 && (
            <Note>
              Almost there!
              <br />
              We&apos;re busy destroying the fees!
            </Note>
          )) || (
            <Note>
              Curious about what&apos;s happening with your transaction?
              <br />
              Here&apos;s what we&apos;re up to!
            </Note>
          )}
      </Body>
    </Wrapper>
  )
}

export default Progress

import React, { useEffect, useState } from 'react'
import { Message, Wrapper, TopMostWrapper, ImageWrapper } from './InstructionStyles'
import ferris_wheel from '../../../assets/v2/images/ferris_wheel.svg'
import finger_right from '../../../assets/v2/images/finger_right.svg'
import clapping_hands from '../../../assets/v2/images/clapping_hands.svg'
import hot_cup_loading from '../../../assets/v2/images/hot_cup_loading.gif'
import thought_baloon from '../../../assets/v2/images/thought_baloon.svg'
// import SwapContext from 'store/swap-context'
// import { useSwapState } from 'state/swap/hooks'

const Instruction = ({
  isASelected,
  isBSelected,
  typedValue,
}: {
  isASelected: boolean
  isBSelected: boolean
  typedValue: string
}) => {
  const [imgURL, setImgURL] = useState(ferris_wheel)
  const [message, setMessage] = useState('')
  const [background, setBackground] = useState('#ffffff')

  useEffect(() => {
    // check for the first render and after 1 second display first instruction
    if (!isASelected && !isBSelected && message === '') {
      setTimeout(() => {
        setImgURL(finger_right)
        setMessage('Select a token and enter amount')
        setBackground('#fff6f6')
      }, 2000)
    } else if (!isASelected && !isBSelected) {
      setImgURL(finger_right)
      setMessage('Select a token and enter amount')
      setBackground('#fff6f6')
    }
    // check if one of the tokens is selected, but not both
    else if (!(isASelected && isBSelected) && (isASelected || isBSelected)) {
      setImgURL(clapping_hands)
      setBackground('#fff6f6')
      setMessage('Select the next token')
    }
    //check if both of the tokens are selected, but no numerical input
    else if (isASelected && isBSelected && !typedValue) {
      setImgURL(finger_right)
      setMessage('Enter amount')
      setBackground('#fff6f6')
    }
    // check for all the required info for loading
    else if (isASelected && isBSelected && typedValue) {
      setImgURL(hot_cup_loading)
      setBackground('#fff6f6')
      setMessage('Calculating the optimal price...')
    } else {
      setImgURL(thought_baloon)
      setBackground('#fff6f6')
      setMessage('Please try again.')
    }
  }, [isASelected, isBSelected, typedValue, message])

  return (
    <TopMostWrapper>
      <Wrapper background={background}>
        <ImageWrapper>
          <img src={imgURL} width={imgURL === ferris_wheel ? '60px' : '111px'} />
        </ImageWrapper>
        <Message>{message}</Message>
      </Wrapper>
    </TopMostWrapper>
  )
}
export default Instruction

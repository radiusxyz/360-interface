import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useEffect } from 'react'
import { useDarkModeManager } from 'state/user/hooks'

import { SupportedChainId } from '../constants/chains'

const initialStyles = {
  width: '200vw',
  height: '200vh',
  transform: 'translate(-50vw, -100vh)',
  backgroundBlendMode: '',
}
const backgroundResetStyles = {
  width: '100vw',
  height: '100vh',
  transform: 'unset',
  backgroundBlendMode: '',
}

type TargetBackgroundStyles = typeof initialStyles | typeof backgroundResetStyles

const backgroundRadialGradientElement = document.getElementById('background-radial-gradient')
const setBackground = (newValues: TargetBackgroundStyles) =>
  Object.entries(newValues).forEach(([key, value]) => {
    if (backgroundRadialGradientElement) {
      backgroundRadialGradientElement.style[key as keyof typeof backgroundResetStyles] = value
    }
  })
export default function RadialGradientByChainUpdater(): null {
  const { chainId } = useActiveWeb3React()
  const [darkMode] = useDarkModeManager()
  // manage background color
  useEffect(() => {
    if (!backgroundRadialGradientElement) {
      return
    }

    switch (chainId) {
      case SupportedChainId.ARBITRUM_ONE:
      case SupportedChainId.ARBITRUM_RINKEBY:
        setBackground(backgroundResetStyles)
        const arbitrumLightGradient = 'radial-gradient(150% 100% at 50% 0%, #CDE8FB 0%, #FCF3F9 50%, #FFFFFF 100%)'
        const arbitrumDarkGradient = 'radial-gradient(150% 100% at 50% 0%, #0A294B 0%, #221E30 50%, #1F2128 100%)'
        backgroundRadialGradientElement.style.background = darkMode ? arbitrumDarkGradient : arbitrumLightGradient
        break
      case SupportedChainId.OPTIMISM:
      case SupportedChainId.OPTIMISTIC_KOVAN:
        setBackground(backgroundResetStyles)
        const optimismLightGradient = 'radial-gradient(150% 100% at 50% 0%, #FFFBF2 2%, #FFF4F9 53%, #FFFFFF 100%)'
        const optimismDarkGradient = 'radial-gradient(150% 100% at 50% 0%, #3E2E38 2%, #2C1F2D 53%, #1F2128 100%)'
        backgroundRadialGradientElement.style.background = darkMode ? optimismDarkGradient : optimismLightGradient
        break
      case SupportedChainId.POLYGON:
      case SupportedChainId.POLYGON_MUMBAI:
        setBackground(backgroundResetStyles)
        const polygonLightGradient =
          'radial-gradient(153.32% 100% at 47.26% 0%, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0)  100%), #FFFFFF'
        const polygonDarkGradient = 'radial-gradient(#e9e9ff 0%, #ffffff 100%)'
        backgroundRadialGradientElement.style.background = darkMode ? polygonDarkGradient : polygonLightGradient
        backgroundRadialGradientElement.style.backgroundBlendMode = darkMode ? 'overlay,normal' : 'multiply,normal'
        break
      default:
        setBackground(initialStyles)
        backgroundRadialGradientElement.style.background = ''
    }
  }, [darkMode, chainId])
  return null
}

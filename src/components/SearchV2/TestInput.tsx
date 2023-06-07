import { useEffect, useState } from 'react'

type Props = {}

const TestInput: React.FC<Props> = (props: Props) => {
  const [prompt, setPrompt] = useState('')
  const handlePrompt = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value)
  }

  useEffect(() => {
    setTimeout(() => {
      //console.log('hello')
    }, 500)
    return () => {
      //console.log('world')
    }
  }, [prompt])

  return <input name="search" type="text" onChange={handlePrompt} />
}

export default TestInput

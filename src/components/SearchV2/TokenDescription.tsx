import { Logo, Title, Wrapper } from './TokenDescriptionStyles'

type Props = {
  title: string
}

const TokenDescription: React.FC<Props> = (props: Props) => {
  return (
    <Wrapper>
      <Logo />
      <Title>{props.title}</Title>
    </Wrapper>
  )
}

export default TokenDescription

import { Description, Logo, Title, Wrapper } from './EnhancedTokenDescriptionStyles'

type Props = { title: string; description: string }

const EnhancedTokenDescription = (props: Props) => {
  return (
    <Wrapper>
      <Logo />
      <Title>{props.title}</Title>
      <Description>{props.description}</Description>
    </Wrapper>
  )
}

export default EnhancedTokenDescription

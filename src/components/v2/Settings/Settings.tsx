import Switch from '../UI/Switch'
import { InfoIcon } from '../RightSection/RightSectionStyles'
import { PrimaryButton } from '../UI/Buttons'
import {
  Body,
  BottomDescWrapper,
  Close,
  Description,
  Footer,
  Header,
  HeaderTitle,
  Input,
  InputWrapper,
  MevSettingWrapper,
  Option,
  OptionsRow,
  SlippageSettingWrapper,
  TopDescWrapper,
  Wrapper,
} from './SettingsStyles'

type Props = {
  isSelected?: boolean
  handleShowSettings?: (e: React.MouseEvent<HTMLImageElement | SVGSVGElement>) => void
}

const Settings = ({ isSelected, handleShowSettings }: Props) => {
  return (
    <Wrapper longerVersion={isSelected}>
      <Header>
        <HeaderTitle>Settings</HeaderTitle>
        <Close onClick={handleShowSettings}>
          <path
            d="M4.16675 4.16663L15.8334 15.8333M4.16675 15.8333L15.8334 4.16663"
            stroke="#6D6D6D"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Close>
      </Header>
      <Body>
        <SlippageSettingWrapper>
          <TopDescWrapper>
            <Description>Slippage tolerance</Description>
          </TopDescWrapper>
          <OptionsRow>
            <Option>0.1%</Option>
            <Option>0.5%</Option>
            <Option>1%</Option>
          </OptionsRow>
          <InputWrapper>
            <Input />
            <span>%</span>
          </InputWrapper>
        </SlippageSettingWrapper>
        <MevSettingWrapper>
          <BottomDescWrapper>
            <Description>MEV Protection Guarantee</Description>
            <InfoIcon />
          </BottomDescWrapper>
          <Switch />
        </MevSettingWrapper>
      </Body>
      <Footer>
        <PrimaryButton>OK</PrimaryButton>
      </Footer>
    </Wrapper>
  )
}

export default Settings

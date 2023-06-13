import {
  Description,
  Details,
  DetailsRow,
  InfoIcon,
  Note,
  PreviewImg,
  Property,
  PropertyName,
  Value,
  Wrapper,
} from './PreviewStyles'

const Preview = () => {
  return (
    <Wrapper>
      <Description>
        <PreviewImg />
        <Note>Preview the results before clicking the button!</Note>
      </Description>
      <Details>
        <DetailsRow>
          <Property>
            <InfoIcon />
            <PropertyName>Protected</PropertyName>
          </Property>
          <Value>1.006 ETH</Value>
        </DetailsRow>
        <DetailsRow>
          <Property>
            <InfoIcon />
            <PropertyName>Save your Gas fee</PropertyName>
          </Property>
          <Value>No Fee</Value>
        </DetailsRow>
        <DetailsRow>
          <Property>
            <Property>
              <InfoIcon />
              <PropertyName>Extra profit</PropertyName>
            </Property>
          </Property>
          <Value>0.22 DAI</Value>
        </DetailsRow>
        <DetailsRow>
          <Property>
            <InfoIcon />
            <PropertyName>Estimate Time</PropertyName>
          </Property>
          <Value>1m</Value>
        </DetailsRow>
      </Details>
    </Wrapper>
  )
}

export default Preview

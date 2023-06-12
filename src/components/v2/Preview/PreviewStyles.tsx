import styled from 'styled-components/macro'
import preview_swap from '../../../assets/v2/images/preview.png'
import info_icon from '../../../assets/v2/images/info_icon.png'

export const Wrapper = styled.div`
  display: flex;
  background: #ffffff;
  border: 1px solid #dde0ff;
  box-shadow: 0px 4px 21px rgba(90, 18, 61, 0.1);
  border-radius: 4px;
  padding: 60px 30px 36px 30px;
  flex-direction: column;
  max-width: 500px;
  width: 100%;
  gap: 46px;
`

export const Description = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`

export const PreviewImg = styled.img.attrs({
  src: preview_swap,
  width: '65px',
})``

export const Note = styled.p`
  font-weight: 400;
  font-size: 16px;
  line-height: 144.52%;
  text-align: center;
  color: #000000;
`

export const Details = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`
export const DetailsRow = styled.div`
  display: flex;
  background: #f5f4ff;
  padding: 14px 26px 13px 26px;
  width: 100%;
  justify-content: space-between;
`

export const Property = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`

export const InfoIcon = styled.img.attrs({ src: info_icon, width: '14px' })``

export const PropertyName = styled.span`
  font-weight: 500;
  font-size: 14px;
  line-height: 144.52%;
  color: #333333;
`
export const Value = styled.span`
  font-weight: 500;
  font-size: 16px;
  line-height: 144.52%;
  text-align: right;
  color: #000000;
`

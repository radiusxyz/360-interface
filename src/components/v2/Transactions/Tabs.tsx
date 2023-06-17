import { Completed, InProgress, Wrapper } from './TabsStyles'

type Props = {
  handleTabClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  activeTab: string
}

const Tabs = ({ handleTabClick, activeTab }: Props) => {
  return (
    <Wrapper>
      <InProgress isActive={activeTab === 'In Progress' ? true : false} onClick={handleTabClick}>
        In Progress
      </InProgress>
      <Completed isActive={activeTab === 'Completed' ? true : false} onClick={handleTabClick}>
        Completed
      </Completed>
    </Wrapper>
  )
}

export default Tabs

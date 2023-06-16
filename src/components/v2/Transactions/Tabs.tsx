import { useState } from 'react'
import { Completed, InProgress, Wrapper } from './TabsStyles'

const Tabs = () => {
  const [activeTab, setActiveTab] = useState('In Progress')
  const handleTabClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const target = event.target as HTMLButtonElement
    setActiveTab(target.textContent as string)
  }
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

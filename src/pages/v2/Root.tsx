import React from 'react'
import { Outlet } from 'react-router-dom'
import AppBar from '../../components/v2/AppBar'

const Root = () => {
  return (
    <>
      <AppBar />
      <main>
        <Outlet />
      </main>
    </>
  )
}

export default Root

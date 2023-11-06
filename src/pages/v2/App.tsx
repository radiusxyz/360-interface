import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import About from './About'
import History from './History'
import Root from './Root'
import Swap from './Swap'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      { index: true, element: <Swap /> },
      { path: 'about', element: <About /> },
      { path: 'history/:status', element: <History /> },
    ],
  },
])

const App = () => {
  return <RouterProvider router={router}></RouterProvider>
}

export default App

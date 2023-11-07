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
      { path: 'history/:status', element: <History /> },
      { path: 'radius', element: <About /> },
    ],
  },
])

const App = () => {
  return <RouterProvider router={router}></RouterProvider>
}

export default App

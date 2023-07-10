import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import About from './About'
import History from './History'
import MyProfit from './MyProfit'
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
      { path: 'my-profit', element: <MyProfit /> },
    ],
  },
])

const App = () => {
  return <RouterProvider router={router}></RouterProvider>
}

export default App

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store/store'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Expenses } from './pages/Expenses'

function App() {
  return (
    <BrowserRouter>
      <Provider store={store}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="expenses" element={<Expenses />} />
          </Route>
        </Routes>
      </Provider>
    </BrowserRouter>
  )
}

export default App

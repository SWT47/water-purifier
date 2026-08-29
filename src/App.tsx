import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProductsPage from './pages/Products/ProductsPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route index element={<ProductsPage />} />
        <Route path="products" element={<ProductsPage />} />
      </Routes>
    </Layout>
  )
}

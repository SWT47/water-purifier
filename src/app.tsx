import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProductsPage from '@/pages/Products/ProductsPage';
import ProductDetailPage from '@/pages/ProductDetail/ProductDetailPage';
import ComparePage from '@/pages/Compare/ComparePage';
import ComboPage from '@/pages/Combo/ComboPage';
import LivePage from '@/pages/Live/LivePage';
import LiveComboPage from '@/pages/Live/LiveComboPage';
import NotFound from '@/pages/NotFound/NotFound';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/products/water_purifier" replace />} />
      <Route path="/products/detail/:id" element={<ProductDetailPage />} />
      <Route path="/products/:category" element={<ProductsPage />} />
      <Route path="/compare" element={<ComparePage />} />
      <Route path="/combo" element={<ComboPage />} />
      <Route path="/live/:category" element={<LivePage />} />
      <Route path="/live-combo" element={<LiveComboPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;

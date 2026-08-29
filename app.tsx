import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';

import Layout from './components/Layout';
import ProductsPage from './pages/Products/ProductsPage';
import ComparePage from './pages/Compare/ComparePage';
import ComboPage from './pages/Combo/ComboPage';
import LivePage from './pages/Live/LivePage';
import LiveComboPage from './pages/Live/LiveComboPage';
import NotFound from './pages/NotFound/NotFound';

const RoutesComponent = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          index
          element={<Navigate to="/products/water_purifier" replace />}
        />
        <Route path="products/:category" element={<ProductsPage />} />
        <Route path="compare" element={<ComparePage />} />
        <Route path="combo" element={<ComboPage />} />
      </Route>
      <Route path="/live" element={<Navigate to="/live/water_purifier" replace />} />
      <Route path="/live/:category" element={<LivePage />} />
      <Route path="/live-combo" element={<LiveComboPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RoutesComponent;

import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Droplets,
  Thermometer,
  Filter,
  Package,
  Droplet,
  Waves,
  GitCompare,
  Smartphone,
  Layers,
} from 'lucide-react';
import {
  ProductCategory,
  CATEGORY_LABELS,
} from '@client/src/utils/categories';

import TDSQueryModal from './TDSQueryModal';

const CATEGORIES: { key: ProductCategory; icon: React.ReactNode }[] = [
  { key: 'water_purifier', icon: <Droplets className="w-4 h-4" /> },
  { key: 'pipeline_machine', icon: <Thermometer className="w-4 h-4" /> },
  { key: 'pre_filter', icon: <Filter className="w-4 h-4" /> },
  { key: 'big_white_bottle', icon: <Package className="w-4 h-4" /> },
  { key: 'central_purifier', icon: <Droplet className="w-4 h-4" /> },
  { key: 'central_softener', icon: <Waves className="w-4 h-4" /> },
];

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tdsOpen, setTdsOpen] = useState(false);

  const getActiveCategory = (): string | null => {
    const match = location.pathname.match(/^\/products\/([^/]+)/);
    return match ? match[1] : null;
  };

  const activeCategory = getActiveCategory();
  const isCompareActive = location.pathname.startsWith('/compare');
  const isComboActive = location.pathname.startsWith('/combo');
  const hideSidebar = location.pathname.startsWith('/combo');

  const handleCategoryClick = (category: ProductCategory) => {
    navigate(`/products/${category}`);
  };

  const handleCompareClick = () => {
    navigate('/compare');
  };

  const handleComboClick = () => {
    navigate('/combo');
  };

  return (
    <div className="w-screen h-screen flex bg-gray-50">
      {/* 左侧大纲导航 - 搭配页隐藏 */}
      {!hideSidebar && (
        <aside className="w-[220px] flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo 区 */}
        <div
          className="px-5 py-5 border-b border-gray-200"
          style={{ padding: '20px' }}
        >
          <h1 className="text-base font-semibold text-gray-900 leading-tight">
            净水产品直播系统
          </h1>
        </div>

        {/* 类目列表 */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {CATEGORIES.map((item) => {
            const isActive = activeCategory === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleCategoryClick(item.key)}
                className={[
                  'w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors text-left',
                  isActive
                    ? 'bg-black text-white'
                    : 'text-gray-700 hover:bg-gray-100',
                ].join(' ')}
              >
                {item.icon}
                <span>{CATEGORY_LABELS[item.key]}</span>
              </button>
            );
          })}
        </nav>

        {/* 底部：对比入口 */}
        <div className="border-t border-gray-200 py-2">
          <button
            onClick={handleComboClick}
            className={[
              'w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors text-left',
              isComboActive
                ? 'bg-black text-white'
                : 'text-gray-700 hover:bg-gray-100',
            ].join(' ')}
          >
            <Layers className="w-4 h-4" />
            <span>产品搭配</span>
          </button>
          <button
            onClick={handleCompareClick}
            className={[
              'w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors text-left',
              isCompareActive
                ? 'bg-black text-white'
                : 'text-gray-700 hover:bg-gray-100',
            ].join(' ')}
          >
            <GitCompare className="w-4 h-4" />
            <span>产品对比</span>
          </button>
        </div>
        </aside>
      )}

      {/* 右侧内容区 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部 Banner */}
        <div className="h-12 bg-black text-white flex items-center justify-between px-6 text-sm font-medium">
          <span>产品专场 · 直播展示</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTdsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors"
              title="全国水质TDS查询"
            >
              <Droplets className="w-3.5 h-3.5" />
              水质TDS查询
            </button>
            <button
              onClick={() => {
                const cat = activeCategory || 'water_purifier';
                navigate(`/live/${cat}`);
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors"
              title="切换到竖屏直播模式"
            >
              <Smartphone className="w-3.5 h-3.5" />
              直播模式
            </button>
          </div>
        </div>
        {/* 页面内容 */}
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </main>

      <TDSQueryModal open={tdsOpen} onClose={() => setTdsOpen(false)} />
    </div>
  );
};

export default Layout;

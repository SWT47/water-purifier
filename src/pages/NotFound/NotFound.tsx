import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-orange-500" />
          </div>
        </div>
        <h1 className="text-7xl font-bold text-black tracking-tight mb-2">
          404
        </h1>
        <p className="text-xl font-semibold text-gray-800 mb-2">
          页面不存在
        </p>
        <p className="text-sm text-gray-500 mb-8">
          您访问的页面可能已被移除或链接有误
        </p>
        <Button
          variant="black"
          size="lg"
          onClick={() => navigate('/products/water_purifier')}
          className="px-8"
        >
          <Home className="w-4 h-4 mr-2" />
          返回首页
        </Button>
      </div>
    </div>
  );
};

export default NotFound;

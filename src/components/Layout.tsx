import { ReactNode, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Droplets,
  Waves,
  Filter,
  Cylinder,
  Building2,
  Shapes,
  Menu,
  X,
} from 'lucide-react'
import TDSQueryModal from './TDSQueryModal'

interface LayoutProps {
  children: ReactNode
}

const navItems = [
  { path: '/products', label: '全部产品', icon: LayoutDashboard },
  { path: '/products?cat=water_purifier', label: '净水器', icon: Droplets },
  { path: '/products?cat=pipeline_machine', label: '管线机', icon: Waves },
  { path: '/products?cat=pre_filter', label: '前置过滤器', icon: Filter },
  { path: '/products?cat=big_white_bottle', label: '大白瓶', icon: Cylinder },
  { path: '/products?cat=central_purifier', label: '中央净水机', icon: Building2 },
  { path: '/products?cat=central_softener', label: '中央软水机', icon: Shapes },
]

export default function Layout({ children }: LayoutProps) {
  const [tdsOpen, setTdsOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const isActive = (path: string): boolean => {
    if (path === '/products') {
      return (
        location.pathname === '/' || location.pathname === '/products'
      ) && !location.search.includes('cat=')
    }
    const params = new URLSearchParams(location.search)
    const catParam = path.split('cat=')[1]
    return params.get('cat') === catParam
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between bg-black text-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Droplets size={20} />
          <span className="font-semibold">净水直播展示</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-md hover:bg-white/10"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Top Banner */}
      <div className="hidden lg:flex items-center justify-between bg-black text-white px-6 py-3">
        <div className="flex items-center gap-3">
          <Droplets size={22} className="text-blue-400" />
          <div>
            <h1 className="text-base font-semibold">净水器产品专场</h1>
            <p className="text-xs text-gray-400">直播选品 · 实时对比 · 一键下单</p>
          </div>
        </div>
        <button
          onClick={() => setTdsOpen(true)}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-[6px] text-sm font-medium transition-colors"
        >
          <Droplets size={16} className="text-blue-300" />
          <span>水质TDS查询</span>
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
          fixed lg:sticky top-0 lg:top-0 z-40 lg:z-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          transition-transform duration-200
          w-[220px] min-h-[calc(100vh-0px)] lg:min-h-[calc(100vh-52px)]
          bg-white border-r border-[#E5E7EB] shadow-sm
        `}
        >
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <Droplets size={18} className="text-blue-500" />
              <span className="font-semibold">净水直播展示</span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 rounded-md hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="py-3 px-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 mb-0.5 text-sm rounded-[6px] transition-colors
                    ${active
                      ? 'bg-black text-white font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </aside>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/30 z-30"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Mobile TDS button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-30">
        <button
          onClick={() => setTdsOpen(true)}
          className="flex items-center gap-2 bg-black text-white px-4 py-3 rounded-full shadow-lg text-sm font-medium"
        >
          <Droplets size={18} className="text-blue-300" />
          <span>水质TDS</span>
        </button>
      </div>

      <TDSQueryModal open={tdsOpen} onClose={() => setTdsOpen(false)} />
    </div>
  )
}

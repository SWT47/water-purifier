import { useState, useMemo } from 'react'
import { Droplets, Info, AlertTriangle } from 'lucide-react'
import Dialog from './ui/dialog'
import Select from './ui/select'
import Badge from './ui/badge'
import type { TDSCityData, TDSLevelInfo } from '@/utils/tds-data'
import {
  TDS_DATA,
  getTDSLevel,
  TDS_LEVELS,
  getProvinces,
  getCitiesByProvince,
} from '@/utils/tds-data'

interface TDSQueryModalProps {
  open: boolean
  onClose: () => void
}

export default function TDSQueryModal({ open, onClose }: TDSQueryModalProps) {
  const provinces = useMemo(() => getProvinces(), [])
  const [selectedProvince, setSelectedProvince] = useState<string>('北京')
  const [selectedCity, setSelectedCity] = useState<string>('北京')
  const [customTDS, setCustomTDS] = useState<string>('')

  const cities = useMemo(
    () => getCitiesByProvince(selectedProvince),
    [selectedProvince],
  )

  const currentTDS = useMemo(() => {
    if (customTDS) {
      const num = parseInt(customTDS, 10)
      if (!isNaN(num)) return num
    }
    const cityData = TDS_DATA.find(
      (item: TDSCityData) => item.province === selectedProvince && item.city === selectedCity,
    )
    return cityData?.tds ?? 0
  }, [selectedProvince, selectedCity, customTDS])

  const levelInfo = getTDSLevel(currentTDS)

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const province = e.target.value
    setSelectedProvince(province)
    const citiesOfProvince = getCitiesByProvince(province)
    if (citiesOfProvince.length > 0) {
      setSelectedCity(citiesOfProvince[0].city)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="水质TDS查询" maxWidth="max-w-lg">
      <div className="p-5 space-y-5">
        {/* 选择区域 */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-800">选择城市</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">省份</label>
              <Select
                value={selectedProvince}
                onChange={handleProvinceChange}
                className="w-full"
              >
                {provinces.map((province: string) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">城市</label>
              <Select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value)
                  setCustomTDS('')
                }}
                className="w-full"
              >
                {cities.map((item: TDSCityData) => (
                  <option key={item.city} value={item.city}>
                    {item.city}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* 或自定义输入 */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            或输入本地TDS数值（ppm）
          </label>
          <input
            type="number"
            placeholder="输入TDS数值"
            value={customTDS}
            onChange={(e) => setCustomTDS(e.target.value)}
            className="h-9 w-full rounded-[6px] border border-[#E5E7EB] px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
          />
        </div>

        {/* TDS结果展示 */}
        <div
          className="rounded-[6px] p-5 border"
          style={{ backgroundColor: levelInfo.bgColor, borderColor: levelInfo.color + '30' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Droplets size={20} style={{ color: levelInfo.color }} />
                <span
                  className="text-sm font-medium"
                  style={{ color: levelInfo.color }}
                >
                  {customTDS ? '自定义' : `${selectedProvince} · ${selectedCity}`}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold" style={{ color: levelInfo.color }}>
                  {currentTDS}
                </span>
                <span className="text-sm" style={{ color: levelInfo.color }}>
                  ppm (TDS)
                </span>
              </div>
            </div>
            <Badge
              className="text-base px-3 py-1"
              style={{ backgroundColor: levelInfo.color, color: '#fff' }}
            >
              {levelInfo.level}
            </Badge>
          </div>
          <p className="mt-3 text-sm" style={{ color: levelInfo.color }}>
            {levelInfo.description}
          </p>
        </div>

        {/* TDS等级对照表 */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Info size={14} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-800">TDS等级对照表</span>
          </div>
          <div className="space-y-2">
            {TDS_LEVELS.map((level: TDSLevelInfo) => (
              <div
                key={level.level}
                className="flex items-center gap-3 px-3 py-2 rounded-md bg-gray-50"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: level.color }}
                />
                <span className="text-sm font-medium text-gray-800 w-20">
                  {level.level}
                </span>
                <span className="text-xs text-gray-500">{level.range}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 温馨提示 */}
        <div className="bg-amber-50 border border-amber-200 rounded-[6px] p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-800 space-y-1">
              <p className="font-medium">温馨提示</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li>TDS 值仅供参考，不能完全代表水质好坏</li>
                <li>TDS 高说明水中溶解性固体多，建议使用 RO 反渗透净水器</li>
                <li>数据来源于网络公开资料，具体以当地实际水质为准</li>
                <li>建议购买专业TDS笔自行检测家中自来水真实数值</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

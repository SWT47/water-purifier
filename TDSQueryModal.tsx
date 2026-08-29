import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { Droplets, Info } from 'lucide-react';
import {
  TDS_DATA,
  TDS_LEVELS,
  getTDSLevel,
  getProvinces,
  getCitiesByProvince,
  type TDSCityData,
} from '@client/src/utils/tds-data';

interface TDSQueryModalProps {
  open: boolean;
  onClose: () => void;
}

const TDSQueryModal: React.FC<TDSQueryModalProps> = ({ open, onClose }) => {
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');

  const provinces = useMemo(() => getProvinces(), []);
  const cities = useMemo(() => {
    if (!province) return [];
    return getCitiesByProvince(province);
  }, [province]);

  const selectedCity: TDSCityData | undefined = useMemo(() => {
    if (!province || !city) return undefined;
    return cities.find((c: TDSCityData) => c.city === city);
  }, [province, city, cities]);

  const level = selectedCity ? getTDSLevel(selectedCity.tds) : null;

  const handleProvinceChange = (val: string) => {
    setProvince(val);
    setCity('');
  };

  const handleCityChange = (val: string) => {
    setCity(val);
  };

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="max-w-2xl w-[92vw] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-gray-100">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-600" />
            全国水质TDS值查询
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          {/* 选择区 */}
          <div className="flex items-end gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1.5">省份</label>
              <Select value={province} onValueChange={handleProvinceChange}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="请选择省份" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((p: string) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1.5">城市</label>
              <Select
                value={city}
                onValueChange={handleCityChange}
                disabled={!province}
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder={province ? '请选择城市' : '请先选择省份'} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c: TDSCityData) => (
                    <SelectItem key={c.city} value={c.city}>
                      {c.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 结果展示 */}
          {selectedCity && level ? (
            <div className={`rounded-lg border ${level.border} ${level.bg} p-6 mb-6`}>
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">
                    {selectedCity.province} · {selectedCity.city}
                  </div>
                  <div className="text-5xl font-bold text-gray-900 leading-tight">
                    {selectedCity.tds}
                    <span className="text-lg font-normal text-gray-500 ml-1">mg/L</span>
                  </div>
                </div>
                <div className={`text-xl font-bold ${level.color}`}>
                  {level.label}
                </div>
              </div>
              <div className="text-sm text-gray-600 leading-relaxed">
                {level.desc}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 mb-6 text-center">
              <Droplets className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <div className="text-sm text-gray-400">请选择省份和城市查看TDS值</div>
            </div>
          )}

          {/* TDS等级说明 */}
          <div className="mb-6">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 mb-3">
              <Info className="w-4 h-4 text-gray-500" />
              TDS值等级对照表
            </div>
            <div className="grid grid-cols-3 gap-2">
              {TDS_LEVELS.map((lv) => (
                <div
                  key={lv.min}
                  className={`rounded-md border ${lv.border} ${lv.bg} px-3 py-2.5`}
                >
                  <div className={`text-sm font-bold ${lv.color} mb-0.5`}>
                    {lv.min === 0 ? '0' : lv.min}
                    {lv.max >= 10000 ? '以上' : `-${lv.max}`}
                  </div>
                  <div className="text-xs text-gray-600">{lv.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 温馨提示 */}
          <div className="rounded-md bg-blue-50 border border-blue-100 px-4 py-3">
            <div className="text-xs text-blue-700 leading-relaxed">
              <span className="font-semibold">💡 温馨提示：</span>
              TDS（总溶解固体）值越低，说明水中溶解性矿物质越少，水质越纯净。
              我国《生活饮用水卫生标准》规定TDS值≤1000mg/L为合格饮用水。
              一般而言，TDS值在300mg/L以上的地区建议安装净水器，RO反渗透净水器可有效降低TDS值至50mg/L以下。
              以上数据为参考值，实际水质因水源、季节、管网等因素会有波动。
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TDSQueryModal;

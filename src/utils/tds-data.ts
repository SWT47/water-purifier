import type { TDSCityData, TDSLevel } from '@/types'

export const TDS_DATA: TDSCityData[] = [
  // 北京
  { province: '北京', city: '北京', tds: 320 },
  // 上海
  { province: '上海', city: '上海', tds: 210 },
  // 天津
  { province: '天津', city: '天津', tds: 380 },
  // 重庆
  { province: '重庆', city: '重庆', tds: 260 },
  // 广东
  { province: '广东', city: '广州', tds: 120 },
  { province: '广东', city: '深圳', tds: 95 },
  { province: '广东', city: '东莞', tds: 150 },
  // 江苏
  { province: '江苏', city: '南京', tds: 240 },
  { province: '江苏', city: '苏州', tds: 280 },
  { province: '江苏', city: '无锡', tds: 260 },
  // 浙江
  { province: '浙江', city: '杭州', tds: 180 },
  { province: '浙江', city: '宁波', tds: 160 },
  { province: '浙江', city: '温州', tds: 110 },
  // 山东
  { province: '山东', city: '济南', tds: 420 },
  { province: '山东', city: '青岛', tds: 360 },
  { province: '山东', city: '烟台', tds: 340 },
  // 四川
  { province: '四川', city: '成都', tds: 230 },
  { province: '四川', city: '绵阳', tds: 250 },
  // 湖北
  { province: '湖北', city: '武汉', tds: 200 },
  { province: '湖北', city: '宜昌', tds: 180 },
  // 湖南
  { province: '湖南', city: '长沙', tds: 150 },
  // 福建
  { province: '福建', city: '福州', tds: 110 },
  { province: '福建', city: '厦门', tds: 90 },
  // 河南
  { province: '河南', city: '郑州', tds: 450 },
  { province: '河南', city: '洛阳', tds: 430 },
  // 河北
  { province: '河北', city: '石家庄', tds: 480 },
  // 陕西
  { province: '陕西', city: '西安', tds: 370 },
  // 辽宁
  { province: '辽宁', city: '沈阳', tds: 290 },
  { province: '辽宁', city: '大连', tds: 310 },
  // 黑龙江
  { province: '黑龙江', city: '哈尔滨', tds: 220 },
  // 吉林
  { province: '吉林', city: '长春', tds: 240 },
  // 安徽
  { province: '安徽', city: '合肥', tds: 270 },
  // 江西
  { province: '江西', city: '南昌', tds: 130 },
  // 山西
  { province: '山西', city: '太原', tds: 410 },
  // 云南
  { province: '云南', city: '昆明', tds: 170 },
  // 贵州
  { province: '贵州', city: '贵阳', tds: 140 },
  // 广西
  { province: '广西', city: '南宁', tds: 100 },
  // 内蒙古
  { province: '内蒙古', city: '呼和浩特', tds: 390 },
  // 新疆
  { province: '新疆', city: '乌鲁木齐', tds: 460 },
  // 甘肃
  { province: '甘肃', city: '兰州', tds: 380 },
  // 海南
  { province: '海南', city: '海口', tds: 80 },
]

export interface TDSLevelInfo {
  level: TDSLevel
  color: string
  bgColor: string
  description: string
  range: string
}

export function getTDSLevel(tds: number): TDSLevelInfo {
  if (tds < 50) {
    return {
      level: '极软水',
      color: '#059669',
      bgColor: '#D1FAE5',
      description: '水质极软，口感佳，适合直饮',
      range: '0-50 ppm',
    }
  }
  if (tds < 150) {
    return {
      level: '软水',
      color: '#0891B2',
      bgColor: '#CFFAFE',
      description: '水质偏软，适合日常饮用',
      range: '50-150 ppm',
    }
  }
  if (tds < 300) {
    return {
      level: '中等硬水',
      color: '#D97706',
      bgColor: '#FEF3C7',
      description: '水质中等硬度，建议过滤后饮用',
      range: '150-300 ppm',
    }
  }
  if (tds < 500) {
    return {
      level: '硬水',
      color: '#DC2626',
      bgColor: '#FEE2E2',
      description: '水质偏硬，水垢较多，必须安装净水器',
      range: '300-500 ppm',
    }
  }
  return {
    level: '极硬水',
    color: '#7F1D1D',
    bgColor: '#FECACA',
    description: '水质极硬，水垢严重，强烈建议安装RO反渗透净水器',
    range: '500+ ppm',
  }
}

export const TDS_LEVELS: TDSLevelInfo[] = [
  getTDSLevel(0),
  getTDSLevel(100),
  getTDSLevel(200),
  getTDSLevel(400),
  getTDSLevel(600),
]

export function getProvinces(): string[] {
  return Array.from(new Set(TDS_DATA.map((item: TDSCityData) => item.province))).sort()
}

export function getCitiesByProvince(province: string): TDSCityData[] {
  return TDS_DATA.filter((item: TDSCityData) => item.province === province)
}

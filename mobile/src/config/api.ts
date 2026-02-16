/**
 * API 配置文件
 */

declare const __DEV__: boolean
declare const TARO_APP_API_BASE_URL: string

// API 基础配置
const API_CONFIG = {
  // 开发环境API地址
  dev: {
    baseURL: 'http://localhost:3000',
  },
  // 生产环境API地址
  prod: {
    baseURL: 'https://your-production-api.com',
  },
}

// 根据环境获取配置
// 可用 TARO_APP_API_BASE_URL 覆盖（便于小程序真机/LAN 调试）
const ENV = typeof __DEV__ !== 'undefined' ? (__DEV__ ? 'dev' : 'prod') : 'dev'
const ENV_BASE_URL = typeof TARO_APP_API_BASE_URL !== 'undefined'
  ? TARO_APP_API_BASE_URL
  : ''

export const API_BASE_URL = ENV_BASE_URL || API_CONFIG[ENV].baseURL

// API 路径
export const API_PATHS = {
  // 认证相关
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  
  // 酒店相关
  HOTELS: '/api/hotels',
  HOTEL_DETAIL: (id: number) => `/api/hotels/${id}`,
  
  // 预订相关
  BOOKINGS: '/api/bookings',
  BOOKING_DETAIL: (id: number) => `/api/bookings/${id}`,
  CREATE_BOOKING: '/api/bookings',
  UPDATE_BOOKING: (id: number) => `/api/bookings/${id}`,
  
  // 统计相关
  STATISTICS: '/api/statistics',
}

export default {
  API_BASE_URL,
  API_PATHS,
}

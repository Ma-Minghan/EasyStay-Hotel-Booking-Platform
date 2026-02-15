import dayjs from 'dayjs'
import { get } from '../utils/request'
import { API_PATHS } from '../config/api'

export interface Room {
  id: number
  name: string
  price: number
}

export interface Hotel {
  id: number
  name: string
  city: string
  address?: string
  description?: string
  price: number
  pricePerNight?: number  // 后端字段
  score: number
  rating?: number  // 后端字段
  imageUrl?: string  // 后端字段
  images?: string[]  // 后端字段
  thumb: string
  banners: string[]
  rooms: Room[]
  roomTypes?: string[]  // 后端字段
  isMemberDeal: boolean
  tags: string[]
  facilities?: string[]
  status?: string
}

interface FetchHotelsParams {
  page?: number
  pageSize?: number
  city?: string
  keyword?: string
  tag?: string
  roomType?: string
  minPrice?: number
  maxPrice?: number
  startDate?: string
  endDate?: string
  status?: string
}

/**
 * 将后端酒店数据转换为前端需要的格式
 */
const parseJsonArray = (value: any, fallback: string[] = []): string[] => {
  if (Array.isArray(value)) {
    return value
  }

  if (typeof value !== 'string' || value.trim() === '') {
    return fallback
  }

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

const transformHotelData = (hotel: any): Hotel => {
  // 处理图片
  const images = parseJsonArray(hotel.images)
  const thumb = hotel.imageUrl || images[0] || 'https://picsum.photos/id/401/600/400'
  const banners = images.length > 0 ? images : [
    'https://picsum.photos/id/402/800/500',
    'https://picsum.photos/id/403/800/500',
    'https://picsum.photos/id/404/800/500'
  ]

  // 处理房型
  const roomTypes = parseJsonArray(hotel.roomTypes, ['标准间', '大床房', '套房'])
  const rooms: Room[] = roomTypes.map((name: string, index: number) => ({
    id: index + 1,
    name,
    price: hotel.pricePerNight ? hotel.pricePerNight + index * 50 : 200 + index * 50
  }))

  // 处理设施标签
  const facilities = parseJsonArray(hotel.facilities)
  const tags = facilities.length > 0 ? facilities.slice(0, 2) : ['舒适', '便利']

  return {
    id: hotel.id,
    name: hotel.name,
    city: hotel.city || '未知',
    address: hotel.address,
    description: hotel.description,
    price: hotel.pricePerNight || hotel.price || (rooms[0]?.price || 200),
    pricePerNight: hotel.pricePerNight,
    score: hotel.rating || hotel.score || 4.5,
    rating: hotel.rating,
    imageUrl: hotel.imageUrl,
    images,
    thumb,
    banners,
    rooms,
    roomTypes,
    isMemberDeal: hotel.rating ? hotel.rating >= 4.5 : false,
    tags,
    facilities,
    status: hotel.status
  }
}

/**
 * 获取酒店列表
 */
export const fetchHotels = async (params: FetchHotelsParams) => {
  const {
    page = 1,
    pageSize = 10,
    city,
    keyword,
    status // 移除默认值，不再默认筛选 active 状态
  } = params

  try {
    const response = await get<Hotel[]>(API_PATHS.HOTELS, {
      city,
      keyword,
      status: status || undefined // 只在明确传入时才筛选状态
    })

    if (response.code === 200 && response.data) {
      // 转换数据格式
      const hotels = response.data.map(transformHotelData)
      
      // 前端分页
      const start = (page - 1) * pageSize
      const end = start + pageSize
      
      return {
        list: hotels.slice(start, end),
        hasMore: end < hotels.length,
        total: hotels.length
      }
    }

    // 如果API失败，返回空列表
    return {
      list: [],
      hasMore: false,
      total: 0
    }
  } catch (error) {
    console.error('fetchHotels error:', error)
    return {
      list: [],
      hasMore: false,
      total: 0
    }
  }
}

/**
 * 获取酒店详情
 */
export const fetchHotelDetail = async (id: number) => {
  try {
    const response = await get<any>(API_PATHS.HOTEL_DETAIL(id))
    
    if (response.code === 200 && response.data) {
      const hotel = transformHotelData(response.data)
      // 按价格排序房间
      const rooms = [...hotel.rooms].sort((a, b) => a.price - b.price)
      return { ...hotel, rooms }
    }
    
    throw new Error('酒店不存在')
  } catch (error) {
    console.error('fetchHotelDetail error:', error)
    throw error
  }
}

/**
 * 获取订单列表（临时实现，应该使用booking服务）
 */
export const fetchOrders = async () => {
  // 这个函数应该被移到booking服务中，这里保留是为了兼容性
  await new Promise(resolve => setTimeout(resolve, 200))
  return [
    {
      id: 101,
      name: '云栖精选酒店 · 3 号店',
      date: dayjs().add(2, 'day').format('YYYY-MM-DD'),
      status: '待入住'
    },
    {
      id: 102,
      name: '云栖精选酒店 · 8 号店',
      date: dayjs().subtract(12, 'day').format('YYYY-MM-DD'),
      status: '已完成'
    }
  ]
}

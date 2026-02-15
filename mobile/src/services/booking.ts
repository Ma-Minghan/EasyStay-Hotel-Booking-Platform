/**
 * 预订服务
 */

import { get, post, put } from '../utils/request'
import { API_PATHS } from '../config/api'

// 预订信息
export interface Booking {
  id: number
  hotelId: number
  userId: number
  guestName: string
  guestPhone: string
  roomType: string
  checkInDate: string
  checkOutDate: string
  numberOfGuests: number
  totalPrice: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  createdAt: string
  updatedAt: string
  hotel?: {
    id: number
    name: string
    city: string
  }
}

// 创建预订参数
export interface CreateBookingParams {
  hotelId: number
  guestName: string
  guestPhone: string
  roomType: string
  checkInDate: string
  checkOutDate: string
  numberOfGuests: number
  totalPrice: number
}

// 更新预订参数
export interface UpdateBookingParams {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  guestName?: string
  guestPhone?: string
  numberOfGuests?: number
}

// 查询预订参数
export interface QueryBookingsParams {
  hotelId?: number
  status?: string
}

/**
 * 获取预订列表
 */
export const getBookings = async (params?: QueryBookingsParams) => {
  return get<Booking[]>(API_PATHS.BOOKINGS, params, {
    showLoading: true,
  })
}

/**
 * 获取预订详情
 */
export const getBookingDetail = async (id: number) => {
  return get<Booking>(API_PATHS.BOOKING_DETAIL(id), undefined, {
    showLoading: true,
  })
}

/**
 * 创建预订
 */
export const createBooking = async (params: CreateBookingParams) => {
  return post<Booking>(API_PATHS.CREATE_BOOKING, params, {
    showLoading: true,
    loadingText: '正在提交预订...',
  })
}

/**
 * 更新预订
 */
export const updateBooking = async (id: number, params: UpdateBookingParams) => {
  return put<Booking>(API_PATHS.UPDATE_BOOKING(id), params, {
    showLoading: true,
    loadingText: '更新中...',
  })
}

/**
 * 取消预订
 */
export const cancelBooking = async (id: number) => {
  return updateBooking(id, { status: 'cancelled' })
}

export default {
  getBookings,
  getBookingDetail,
  createBooking,
  updateBooking,
  cancelBooking,
}

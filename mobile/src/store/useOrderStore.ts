import Taro from '@tarojs/taro'
import { create } from 'zustand'
import { 
  getBookings, 
  createBooking, 
  cancelBooking,
  type Booking,
  type CreateBookingParams 
} from '../services/booking'

export interface OrderItem {
  id: number
  hotelId: number
  hotelName: string
  roomName?: string
  roomType?: string
  checkIn: string
  checkOut: string
  checkInDate?: string
  checkOutDate?: string
  nights: number
  guestName?: string
  guestPhone?: string
  numberOfGuests?: number
  totalPrice?: number
  status: string
  createdAt: number
}

interface OrderState {
  orders: OrderItem[]
  loading: boolean
  addOrder: (payload: CreateBookingParams) => Promise<boolean>
  loadOrders: () => Promise<void>
  cancelOrder: (id: number) => Promise<boolean>
  clearOrders: () => void
}

const STORAGE_KEY = 'easy-stay-orders'

/**
 * 将后端预订数据转换为前端订单格式
 */
const transformBookingToOrder = (booking: Booking): OrderItem => {
  const checkInDate = booking.checkInDate || booking.checkIn
  const checkOutDate = booking.checkOutDate || booking.checkOut
  
  // 计算住宿天数
  const nights = booking.numberOfGuests || (() => {
    if (checkInDate && checkOutDate) {
      const checkIn = new Date(checkInDate)
      const checkOut = new Date(checkOutDate)
      return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    }
    return 1
  })()

  return {
    id: booking.id,
    hotelId: booking.hotelId,
    hotelName: booking.hotel?.name || '未知酒店',
    roomName: booking.roomType,
    roomType: booking.roomType,
    checkIn: checkInDate || '',
    checkOut: checkOutDate || '',
    checkInDate,
    checkOutDate,
    nights,
    guestName: booking.guestName,
    guestPhone: booking.guestPhone,
    numberOfGuests: booking.numberOfGuests,
    totalPrice: booking.totalPrice,
    status: booking.status === 'confirmed' ? '已确认' : 
            booking.status === 'pending' ? '待确认' :
            booking.status === 'cancelled' ? '已取消' :
            booking.status === 'completed' ? '已完成' : booking.status,
    createdAt: new Date(booking.createdAt).getTime()
  }
}

const readStorage = (): Pick<OrderState, 'orders'> => {
  const cached = Taro.getStorageSync(STORAGE_KEY)
  if (!cached || !Array.isArray(cached.orders)) {
    return { orders: [] }
  }
  return { orders: cached.orders }
}

export const useOrderStore = create<OrderState>(set => ({
  ...readStorage(),
  loading: false,
  addOrder: async (payload: CreateBookingParams) => {
    try {
      set({ loading: true })
      const response = await createBooking(payload)
      
      if (response.code === 200 && response.data) {
        const newOrder = transformBookingToOrder(response.data)
        
        set(state => {
          const next = { orders: [newOrder, ...state.orders] }
          Taro.setStorageSync(STORAGE_KEY, next)
          return { ...next, loading: false }
        })
        
        Taro.showToast({
          title: '预订成功',
          icon: 'success'
        })
        
        return true
      } else {
        set({ loading: false })
        Taro.showToast({
          title: response.message || '预订失败',
          icon: 'none'
        })
        return false
      }
    } catch (error: any) {
      set({ loading: false })
      console.error('Create booking error:', error)
      Taro.showToast({
        title: error.message || '预订失败',
        icon: 'none'
      })
      return false
    }
  },
  loadOrders: async () => {
    try {
      set({ loading: true })
      const response = await getBookings()
      
      if (response.code === 200 && response.data) {
        const orders = response.data.map(transformBookingToOrder)
        const next = { orders }
        Taro.setStorageSync(STORAGE_KEY, next)
        set({ ...next, loading: false })
      } else {
        set({ loading: false })
      }
    } catch (error) {
      set({ loading: false })
      console.error('Load orders error:', error)
    }
  },
  cancelOrder: async (id: number) => {
    try {
      set({ loading: true })
      const response = await cancelBooking(id)
      
      if (response.code === 200) {
        set(state => {
          const orders = state.orders.map(order => 
            order.id === id ? { ...order, status: '已取消' } : order
          )
          const next = { orders }
          Taro.setStorageSync(STORAGE_KEY, next)
          return { ...next, loading: false }
        })
        
        Taro.showToast({
          title: '取消成功',
          icon: 'success'
        })
        
        return true
      } else {
        set({ loading: false })
        Taro.showToast({
          title: response.message || '取消失败',
          icon: 'none'
        })
        return false
      }
    } catch (error: any) {
      set({ loading: false })
      console.error('Cancel order error:', error)
      Taro.showToast({
        title: error.message || '取消失败',
        icon: 'none'
      })
      return false
    }
  },
  clearOrders: () =>
    set(() => {
      const next = { orders: [] }
      Taro.removeStorageSync(STORAGE_KEY)
      return next
    })
}))


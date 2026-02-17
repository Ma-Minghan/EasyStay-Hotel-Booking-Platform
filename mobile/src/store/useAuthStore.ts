import Taro from '@tarojs/taro'
import { create } from 'zustand'
import { login as loginApi, register as registerApi } from '../services/auth'

export interface UserInfo {
  id: number
  name: string
  username?: string
  phone: string
  avatar: string
  role?: string
  favorites: number[]
}

interface AuthState {
  token: string
  userInfo: UserInfo | null
  isLogin: boolean
  login: (payload: { username: string; password: string }) => Promise<boolean>
  register: (payload: { username: string; password: string; phone?: string; verifyCode?: string }) => Promise<boolean>
  logout: () => void
  toggleFavorite: (hotelId: number) => void
  updateUserInfo: (info: Partial<UserInfo>) => void
}

const STORAGE_KEY = 'easy-stay-auth'

const readStorage = (): Pick<AuthState, 'token' | 'userInfo' | 'isLogin'> => {
  const cached = Taro.getStorageSync(STORAGE_KEY)
  if (!cached) {
    return { token: '', userInfo: null, isLogin: false }
  }
  return cached
}

export const useAuthStore = create<AuthState>(set => ({
  ...readStorage(),
  login: async ({ username, password }) => {
    try {
      const response = await loginApi({ username, password })
      
      if (response.code === 200 && response.data) {
        const { token, user } = response.data
        const next = {
          token,
          isLogin: true,
          userInfo: {
            id: user.id,
            name: user.username,
            username: user.username,
            phone: user.phone || '',
            avatar: user.avatar || 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200',
            role: user.role,
            favorites: []
          }
        }
        
        Taro.setStorageSync(STORAGE_KEY, next)
        set(next)
        
        Taro.showToast({
          title: '登录成功',
          icon: 'success'
        })
        
        return true
      } else {
        Taro.showToast({
          title: response.message || '登录失败',
          icon: 'none'
        })
        return false
      }
    } catch (error: any) {
      console.error('Login error:', error)
      Taro.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      })
      return false
    }
  },
  register: async ({ username, password, phone }) => {
    try {
      const response = await registerApi({ username, password, phone })
      
      if (response.code === 200) {
        Taro.showToast({
          title: '注册成功，请登录',
          icon: 'success'
        })
        return true
      } else {
        Taro.showToast({
          title: response.message || '注册失败',
          icon: 'none'
        })
        return false
      }
    } catch (error: any) {
      console.error('Register error:', error)
      Taro.showToast({
        title: error.message || '注册失败',
        icon: 'none'
      })
      return false
    }
  },
  logout: () =>
    set(() => {
      const next = { token: '', userInfo: null, isLogin: false }
      Taro.removeStorageSync(STORAGE_KEY)
      return next
    }),
  toggleFavorite: hotelId =>
    set(state => {
      if (!state.userInfo) return state
      const exists = state.userInfo.favorites.includes(hotelId)
      const favorites = exists
        ? state.userInfo.favorites.filter(id => id !== hotelId)
        : [...state.userInfo.favorites, hotelId]
      const next = {
        ...state,
        userInfo: { ...state.userInfo, favorites }
      }
      Taro.setStorageSync(STORAGE_KEY, next)
      return next
    }),
  updateUserInfo: info =>
    set(state => {
      if (!state.userInfo) return state
      const next = {
        ...state,
        userInfo: { ...state.userInfo, ...info }
      }
      Taro.setStorageSync(STORAGE_KEY, next)
      return next
    })
}))

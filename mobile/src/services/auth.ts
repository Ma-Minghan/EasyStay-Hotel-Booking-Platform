/**
 * Auth services
 */

import { post } from '../utils/request'
import { API_PATHS } from '../config/api'

export interface LoginParams {
  username: string
  password: string
}

export interface RegisterParams {
  username: string
  password: string
  phone?: string
  verifyCode?: string
}

export interface WechatLoginParams {
  code: string
  nickname?: string
  avatar?: string
  phone?: string
}

export interface UserData {
  id: number
  username: string
  role: string
  phone?: string
  avatar?: string
  nickname?: string
  wechatBound?: boolean
}

export interface LoginResponse {
  token: string
  user: UserData
}

export const login = async (params: LoginParams) => {
  return post<LoginResponse>(API_PATHS.AUTH_LOGIN, params, {
    showLoading: true,
    loadingText: '登录中...',
  })
}

export const wechatLogin = async (params: WechatLoginParams) => {
  return post<LoginResponse>(API_PATHS.AUTH_WECHAT_LOGIN, params, {
    showLoading: true,
    loadingText: '微信登录中...',
  })
}

export const register = async (params: RegisterParams) => {
  return post<UserData>(
    API_PATHS.AUTH_REGISTER,
    {
      ...params,
      role: 'user',
    },
    {
      showLoading: true,
      loadingText: '注册中...',
    }
  )
}

export const sendCode = async (phone: string) => {
  return post<{ code: string; expiresIn: number }>(API_PATHS.AUTH_SEND_CODE, { phone }, {
    showLoading: true,
    loadingText: '发送中...',
  })
}

export default {
  login,
  wechatLogin,
  register,
  sendCode,
}

/**
 * 认证服务
 */

import { post } from '../utils/request'
import { API_PATHS } from '../config/api'

// 登录参数
export interface LoginParams {
  username: string
  password: string
}

// 注册参数
export interface RegisterParams {
  username: string
  password: string
  phone?: string
  verifyCode?: string
}

// 用户信息
export interface UserData {
  id: number
  username: string
  role: string
  phone?: string
  avatar?: string
}

// 登录响应
export interface LoginResponse {
  token: string
  user: UserData
}

/**
 * 用户登录
 */
export const login = async (params: LoginParams) => {
  return post<LoginResponse>(API_PATHS.AUTH_LOGIN, params, {
    showLoading: true,
    loadingText: '登录中...',
  })
}

/**
 * 用户注册
 */
export const register = async (params: RegisterParams) => {
  // 移动端用户注册，角色固定为普通用户
  return post<UserData>(API_PATHS.AUTH_REGISTER, {
    ...params,
    role: 'user', // 移动端注册都是普通用户
  }, {
    showLoading: true,
    loadingText: '注册中...',
  })
}

/**
 * 发送验证码（开发态固定验证码）
 */
export const sendCode = async (phone: string) => {
  return post<{ code: string; expiresIn: number }>(API_PATHS.AUTH_SEND_CODE, { phone }, {
    showLoading: true,
    loadingText: '发送中...',
  })
}

export default {
  login,
  register,
  sendCode,
}

import { useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { message } from 'antd';
import { API_BASE_URL } from '../config';

interface UseApiOptions {
  showMessage?: boolean;
}

// 创建 axios 实例
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 请求拦截器：自动添加 token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // token 已经包含 "Bearer " 前缀，直接使用
      config.headers.Authorization = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：统一处理错误
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token 过期或无效，跳转到登录页
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
      message.error('登录已过期，请重新登录');
    }
    return Promise.reject(error);
  }
);

export function useApi(options: UseApiOptions = { showMessage: true }) {
  const [loading, setLoading] = useState(false);

  const request = useCallback(async (method: 'get' | 'post' | 'put' | 'delete', url: string, data?: any, config?: any) => {
    try {
      setLoading(true);
      const response = await axiosInstance({
        method,
        url,
        data,
        ...config,
      });

      if (response.data.code === 200) {
        if (options.showMessage && response.data.message) {
          message.success(response.data.message);
        }
        return response;
      } else {
        if (options.showMessage) {
          message.error(response.data.message || '请求失败');
        }
        return response;
      }
    } catch (error: any) {
      if (options.showMessage) {
        const errorMsg = error.response?.data?.message || error.message || '请求失败';
        message.error(errorMsg);
      }
      console.error('API Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [options.showMessage]);

  return useMemo(() => ({
    loading,
    get: (url: string, config?: any) => request('get', url, undefined, config),
    post: (url: string, data?: any, config?: any) => request('post', url, data, config),
    put: (url: string, data?: any, config?: any) => request('put', url, data, config),
    delete: (url: string, config?: any) => request('delete', url, undefined, config),
  }), [loading, request]);
}

import React, { useState } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../store/useAuthStore'
import './index.scss'

const Login = () => {
  const { login, register } = useAuthStore()
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')

  const handleLogin = async () => {
    if (!username || username.length < 3) {
      Taro.showToast({ title: '请输入用户名（至少3个字符）', icon: 'none' })
      return
    }
    if (!password || password.length < 6) {
      Taro.showToast({ title: '请输入密码（至少6个字符）', icon: 'none' })
      return
    }
    
    const success = await login({ username, password })
    if (success) {
      setTimeout(() => Taro.navigateBack(), 1000)
    }
  }

  const handleRegister = async () => {
    if (!username || username.length < 3) {
      Taro.showToast({ title: '请输入用户名（至少3个字符）', icon: 'none' })
      return
    }
    if (!password || password.length < 6) {
      Taro.showToast({ title: '请输入密码（至少6个字符）', icon: 'none' })
      return
    }
    
    const success = await register({ username, password, phone })
    if (success) {
      // 注册成功后切换到登录模式
      setIsRegister(false)
      Taro.showToast({ title: '注册成功，请登录', icon: 'success' })
    }
  }

  const handleSubmit = () => {
    if (isRegister) {
      handleRegister()
    } else {
      handleLogin()
    }
  }

  return (
    <View className="page login-page">
      <View className="card login-card">
        <Text className="title">{isRegister ? '注册账号' : '欢迎回来'}</Text>
        <View className="field">
          <Text className="label">用户名</Text>
          <Input
            type="text"
            value={username}
            placeholder="请输入用户名"
            onInput={e => setUsername(e.detail.value)}
          />
        </View>
        <View className="field">
          <Text className="label">密码</Text>
          <Input
            type="password"
            password
            value={password}
            placeholder="请输入密码"
            onInput={e => setPassword(e.detail.value)}
          />
        </View>
        {isRegister && (
          <View className="field">
            <Text className="label">手机号（可选）</Text>
            <Input
              type="number"
              value={phone}
              placeholder="请输入手机号"
              onInput={e => setPhone(e.detail.value)}
            />
          </View>
        )}
        <Button className="btn" onClick={handleSubmit}>
          {isRegister ? '注册' : '登录'}
        </Button>
        <View className="toggle-mode" onClick={() => setIsRegister(!isRegister)}>
          <Text className="toggle-text">
            {isRegister ? '已有账号？点击登录' : '没有账号？点击注册'}
          </Text>
        </View>
      </View>
    </View>
  )
}

export default Login

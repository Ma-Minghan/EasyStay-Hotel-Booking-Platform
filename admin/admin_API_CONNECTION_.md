# Admin API 连接说明
---

## 快速开始

### 1. 启动服务
```bash
# 启动后端 (localhost:3000)
cd server && npm install && npm start

# 启动前端 (localhost:5173)
cd admin && npm install && npm run dev
```

### 2. 首次使用
⚠️ **注意**：项目没有预设默认账号，首次使用需先注册：

1. 访问 `http://localhost:5173/login`
2. 点击"去注册"按钮
3. 注册账号（推荐：`admin1` / `123456`，角色选"管理员"）
4. 注册成功后即可登录

---

## 系统架构

```
┌─────────────────┐         HTTP/HTTPS          ┌─────────────────┐
│  Admin Frontend │  ────────────────────────>  │  Backend API    │
│  (React + TS)   │  <────────────────────────  │  (Node + MySQL) │
└─────────────────┘                             └─────────────────┘
     localhost:5173                                localhost:3000
```

---

## API 配置

配置文件：`src/config.ts`

```typescript
export const API_BASE_URL = 'http://localhost:3000';

export const API_ENDPOINTS = {
  auth: { login: '/api/auth/login', register: '/api/auth/register' },
  hotels: {
    list: '/api/hotels',
    detail: (id: string) => `/api/hotels/${id}`,
    create: '/api/hotels',
    update: (id: string) => `/api/hotels/${id}`,
    delete: (id: string) => `/api/hotels/${id}`,
  },
  bookings: { list: '/api/bookings', /* ... */ },
  statistics: { revenue: '/api/statistics/revenue' },
};
```

---

## 认证机制

Token 自动管理：
- 登录后 token 存储在 `localStorage`
- 请求拦截器自动添加 `Authorization` 头
- Token 过期自动跳转登录页

```typescript
// useApi.ts 已配置好拦截器，无需手动处理
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

---

## 使用方法

**推荐：使用 `useApi` Hook**

```typescript
import { useApi } from '../hooks/useApi';
import { API_ENDPOINTS } from '../config';

function MyComponent() {
  const api = useApi();

  // GET 请求
  const fetchData = async () => {
    const data = await api.get(API_ENDPOINTS.hotels.list);
    if (data) console.log(data);
  };

  // POST 请求
  const createData = async (values: any) => {
    const result = await api.post(API_ENDPOINTS.hotels.create, values);
    if (result) console.log('创建成功');
  };

  // PUT/DELETE 类似
  return <button onClick={fetchData} disabled={api.loading}>加载</button>;
}
```

**API 方法**：
- `api.get(url, params)` - GET 请求
- `api.post(url, data, params)` - POST  
- `api.put(url, data, params)` - PUT
- `api.delete(url, params)` - DELETE
- `api.loading` - 加载状态

---

## 完整示例

```typescript
import { useState, useEffect } from 'react';
import { Table, message } from 'antd';
import { useApi } from '../hooks/useApi';
import { API_ENDPOINTS } from '../config';

function HotelList() {
  const [hotels, setHotels] = useState([]);
  const api = useApi({ showMessage: false });

  useEffect(() => { fetchHotels(); }, []);

  const fetchHotels = async () => {
    const data = await api.get(API_ENDPOINTS.hotels.list);
    if (data) setHotels(data);
  };

  const handleDelete = async (id: string) => {
    const result = await api.delete(API_ENDPOINTS.hotels.delete(id));
    if (result) {
      message.success('删除成功');
      fetchHotels();
    }
  };

  return <Table dataSource={hotels} loading={api.loading} rowKey="id" />;
}
```

---

## 常见问题

**CORS 跨域错误**  
确保后端已启用 CORS：`app.use(cors())`

**401 未授权**  
检查 token 是否存在或过期，重新登录

**请求失败**  
- 确认后端服务已启动 (localhost:3000)
- 检查 `API_BASE_URL` 配置

---

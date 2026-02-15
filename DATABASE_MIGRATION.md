# 数据库集成指南

## 文件结构说明

迁移后的后端项目结构如下：

```
server/
├── config/
│   └── database.js              # 数据库连接配置
├── models/
│   ├── User.js                  # 用户模型
│   ├── Hotel.js                 # 酒店模型
│   ├── Booking.js               # 预订模型
│   └── index.js                 # 模型关联定义
├── middleware/
│   └── auth.js                  # JWT 认证中间件
├── routes/
│   ├── auth.js                  # 认证相关接口
│   ├── hotels.js                # 酒店相关接口
│   ├── bookings.js              # 预订相关接口
│   └── statistics.js            # 统计相关接口
├── index.js                     # 启动文件
├── package.json                 # 项目依赖
├── .env                         # 环境变量配置
└── node_modules/                # 依赖包（首次运行 npm install 生成）
```

---

### 步骤 1：安装依赖

```bash
cd server
npm install
```

### 步骤 2：配置数据库

编辑 `server/.env` 文件：

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=easy_stay

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Server
PORT=3000
NODE_ENV=development
```

### 步骤 3：创建数据库

```bash
# 启动 MySQL 服务（Windows）
net start MySQL80

# 创建数据库
mysql -u root -p
> CREATE DATABASE IF NOT EXISTS easy_stay DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
> EXIT;
```

### 步骤 4：启动服务器

```bash
cd server
npm run dev
```

**预期输出** ✅：
```
✅ Database connection has been established successfully.
✅ Database tables synchronized successfully.
✅ Server is running on http://localhost:3000
```

---

## ✅ 验证集成

### 1. 检查数据库表

```sql
mysql -u root -p
USE easy_stay;
SHOW TABLES;
```

应该看到 3 个表：`users`、`hotels`、`bookings`

### 2. 测试 API

**注册用户**：
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin1","password":"123456","role":"admin"}'
```

**登录获取 Token**：
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin1","password":"123456"}'
```

保存返回的 `token`，后续需要认证的请求需要在 Header 中添加：
```
Authorization: Bearer <your_token>
```

---

## 📊 API 端点列表

| 方法 | 路由 | 描述 | 需要 Token |
|------|------|------|-----------|
| POST | `/api/auth/register` | 注册用户 | ❌ |
| POST | `/api/auth/login` | 登录用户 | ❌ |
| GET | `/api/hotels` | 获取酒店列表 | ❌ |
| GET | `/api/hotels/:id` | 获取酒店详情 | ❌ |
| POST | `/api/hotels` | 新增酒店 | ✅ |
| PUT | `/api/hotels/:id` | 编辑/审核酒店 | ✅ |
| DELETE | `/api/hotels/:id` | 删除酒店 | ✅ |
| GET | `/api/bookings` | 获取预订列表 | ❌ |
| POST | `/api/bookings` | 新增预订 | ❌ |
| PUT | `/api/bookings/:id` | 更新预订状态 | ✅ |
| DELETE | `/api/bookings/:id` | 删除预订 | ✅ |
| GET | `/api/statistics/revenue` | 获取统计数据 | ❌ |

---

## 🔧 常见问题

### ❌ 数据库连接失败

**错误**：`ER_ACCESS_DENIED_ERROR` 或 `ECONNREFUSED`

**解决**：
1. 检查 `.env` 中的数据库配置是否正确
2. 确保 MySQL 服务正在运行：`net start MySQL80`
3. 验证用户名密码是否正确

### ❌ 数据库不存在

**错误**：`ER_BAD_DB_ERROR: Unknown database 'easy_stay'`

**解决**：手动创建数据库
```sql
CREATE DATABASE easy_stay CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### ❌ Token 验证失败

**错误**：`Token 过期或无效`

**解决**：确保请求头格式正确
```
Authorization: Bearer <token>
```

### ❌ 端口被占用

**错误**：`EADDRINUSE: address already in use :::3000`

**解决**：
1. 修改 `.env` 中的 `PORT` 为其他端口（如 3001）
2. 或终止占用 3000 端口的进程

---

## 🎯 成功标志

- ✅ 服务器成功启动在 http://localhost:3000
- ✅ 控制台显示数据库连接成功
- ✅ 数据库中创建了 3 个表
- ✅ 可以成功注册和登录
- ✅ API 请求返回预期数据

---

## 📝 依赖包说明

- `sequelize` - ORM 框架
- `mysql2` - MySQL 驱动
- `bcryptjs` - 密码加密
- `jsonwebtoken` - JWT 令牌
- `dotenv` - 环境变量管理
- `express` - Web 框架
- `cors` - 跨域支持

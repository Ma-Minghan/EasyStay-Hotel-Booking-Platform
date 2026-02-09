const express = require('express');
const cors = require('cors');

const app = express();

// 解析 JSON 请求体
app.use(express.json());

// 允许跨域访问（后面 admin 端要调用）
app.use(cors());

// 简单测试接口
app.get('/ping', (req, res) => {
  res.send('pong');
});

// 预留一个登录接口占位，后面再实现具体逻辑
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  console.log('收到登录请求：', username, password);
  return res.json({
    token: 'fake-token',
    user: {
      id: 'u_1',
      username,
      role: 'merchant',
    },
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});

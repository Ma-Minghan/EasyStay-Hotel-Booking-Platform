const express = require('express');
const cors = require('cors');

const app = express();

// 解析 JSON 请求体
app.use(express.json());

// 允许跨域访问
app.use(cors());

// 内存存储：用来保存已注册的用户（实际项目中这里会是数据库）
let users = [];
let userIdCounter = 1;

// 测试接口
app.get('/ping', (req, res) => {
  res.send('pong');
});

// 注册接口
app.post('/api/auth/register', (req, res) => {
  const { username, password, role } = req.body;

  // 简单验证
  if (!username || !password || !role) {
    return res.status(400).json({
      code: 400,
      message: '用户名、密码、角色不能为空',
    });
  }

  // 检查用户名是否已存在
  if (users.some(u => u.username === username)) {
    return res.status(409).json({
      code: 409,
      message: '用户名已存在',
    });
  }

  // 创建新用户
  const newUser = {
    id: `u_${userIdCounter++}`,
    username,
    password, // 注意：实际项目中需要 hash 密码，现在为了演示先明文存
    role, // 'merchant' 或 'admin'
  };

  users.push(newUser);

  return res.json({
    code: 200,
    message: '注册成功',
    data: {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
    },
  });
});

// 登录接口
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  // 简单验证
  if (!username || !password) {
    return res.status(400).json({
      code: 400,
      message: '用户名和密码不能为空',
    });
  }

  // 查找用户
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({
      code: 401,
      message: '用户名或密码错误',
    });
  }

  // 登录成功，返回用户信息和 token（简单 token，实际应用中用 JWT）
  return res.json({
    code: 200,
    message: '登录成功',
    data: {
      token: `token_${user.id}_${Date.now()}`, // 简单的 token
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    },
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});

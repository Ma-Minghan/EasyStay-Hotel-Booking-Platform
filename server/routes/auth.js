const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const router = express.Router();

/**
 * POST /api/auth/register
 * 注册用户
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // 参数验证
    if (!username || !password || !role) {
      return res.status(400).json({
        code: 400,
        message: '用户名、密码、角色不能为空',
      });
    }

    if (!['admin', 'merchant'].includes(role)) {
      return res.status(400).json({
        code: 400,
        message: '角色必须是 admin 或 merchant',
      });
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({
        code: 409,
        message: '用户名已存在',
      });
    }

    // 创建新用户（密码自动 hash）
    const user = await User.create({ username, password, role });

    return res.json({
      code: 200,
      message: '注册成功',
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 参数验证
    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名和密码不能为空',
      });
    }

    // 根据用户名查找用户
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误',
      });
    }

    // 验证密码
    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误',
      });
    }

    // 生成 JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    return res.json({
      code: 200,
      message: '登录成功',
      data: {
        token: `Bearer ${token}`,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

module.exports = router;

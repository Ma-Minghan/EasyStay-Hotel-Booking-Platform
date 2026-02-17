const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const router = express.Router();

// 开发态验证码存储（phone -> { code, expiresAt }）
const verificationCodes = new Map();
const FIXED_CODE = '123456';
const CODE_TTL_MS = 5 * 60 * 1000;

/**
 * POST /api/auth/send-code
 * 发送验证码（开发态固定验证码）
 */
router.post('/send-code', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        code: 400,
        message: '手机号不能为空',
      });
    }

    verificationCodes.set(phone, {
      code: FIXED_CODE,
      expiresAt: Date.now() + CODE_TTL_MS,
    });

    return res.json({
      code: 200,
      message: '验证码已发送（开发环境固定码）',
      data: {
        code: FIXED_CODE,
        expiresIn: CODE_TTL_MS,
      },
    });
  } catch (error) {
    console.error('Send code error:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/register
 * 注册用户
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, role, phone, verifyCode } = req.body;

    // 参数验证
    if (!username || !password || !role) {
      return res.status(400).json({
        code: 400,
        message: '用户名、密码、角色不能为空',
      });
    }

    if (!['admin', 'merchant', 'user'].includes(role)) {
      return res.status(400).json({
        code: 400,
        message: '角色必须是 admin、merchant 或 user',
      });
    }

    // 如果传了手机号，要求验证码通过
    if (phone) {
      const record = verificationCodes.get(phone);
      if (!verifyCode) {
        return res.status(400).json({
          code: 400,
          message: '请输入验证码',
        });
      }
      if (!record || record.code !== verifyCode || record.expiresAt < Date.now()) {
        return res.status(400).json({
          code: 400,
          message: '验证码无效或已过期',
        });
      }
      verificationCodes.delete(phone);
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

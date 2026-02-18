const express = require('express');
const https = require('https');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const verificationCodes = new Map();
const FIXED_CODE = '123456';
const CODE_TTL_MS = 5 * 60 * 1000;

const makeJwtPayload = user => ({
  id: user.id,
  username: user.username,
  role: user.role,
});

const buildAuthResponseData = user => {
  const token = jwt.sign(makeJwtPayload(user), process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

  return {
    token: `Bearer ${token}`,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      phone: user.phone || '',
      avatar: user.avatar || '',
      nickname: user.nickname || user.username,
      wechatBound: Boolean(user.wechatOpenId),
    },
  };
};

const getWechatSession = code =>
  new Promise((resolve, reject) => {
    const appid = process.env.WECHAT_APPID;
    const secret = process.env.WECHAT_SECRET;

    if (!appid || !secret) {
      reject(new Error('WECHAT_APPID or WECHAT_SECRET is not configured'));
      return;
    }

    const query = new URLSearchParams({
      appid,
      secret,
      js_code: code,
      grant_type: 'authorization_code',
    }).toString();

    const url = `https://api.weixin.qq.com/sns/jscode2session?${query}`;

    https
      .get(url, response => {
        let raw = '';
        response.on('data', chunk => {
          raw += chunk;
        });
        response.on('end', () => {
          try {
            const data = JSON.parse(raw);
            if (data.errcode) {
              reject(
                new Error(`WeChat code2session failed: ${data.errmsg || data.errcode}`)
              );
              return;
            }
            resolve(data);
          } catch (error) {
            reject(error);
          }
        });
      })
      .on('error', reject);
  });

const genWechatUsernameBase = openid => `wx_${openid.slice(-10)}`;

const createUniqueWechatUsername = async base => {
  let username = base;
  let suffix = 0;

  // Avoid username conflicts when openid suffix overlaps.
  while (await User.findOne({ where: { username } })) {
    suffix += 1;
    username = `${base}${suffix}`;
  }

  return username;
};

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
    return res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

router.post('/wechat-login', async (req, res) => {
  try {
    const { code, nickname, avatar, phone } = req.body;

    if (!code) {
      return res.status(400).json({
        code: 400,
        message: '微信登录 code 不能为空',
      });
    }

    const session = await getWechatSession(code);
    const openid = session.openid;

    if (!openid) {
      return res.status(400).json({
        code: 400,
        message: '微信登录失败，未获取到 openid',
      });
    }

    let user = await User.findOne({ where: { wechatOpenId: openid } });

    if (!user) {
      const usernameBase = genWechatUsernameBase(openid);
      const username = await createUniqueWechatUsername(usernameBase);
      const randomPassword = crypto.randomBytes(16).toString('hex');

      user = await User.create({
        username,
        password: randomPassword,
        role: 'user',
        phone: phone || null,
        avatar: avatar || '',
        nickname: nickname || '',
        wechatOpenId: openid,
      });
    } else {
      let changed = false;
      if (nickname && nickname !== user.nickname) {
        user.nickname = nickname;
        changed = true;
      }
      if (avatar && avatar !== user.avatar) {
        user.avatar = avatar;
        changed = true;
      }
      if (phone && !user.phone) {
        user.phone = phone;
        changed = true;
      }
      if (changed) {
        await user.save();
      }
    }

    return res.json({
      code: 200,
      message: '微信登录成功',
      data: buildAuthResponseData(user),
    });
  } catch (error) {
    console.error('WeChat login error:', error);
    return res.status(500).json({
      code: 500,
      message: error.message || '微信登录失败',
    });
  }
});

router.post('/wechat-bind', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        code: 400,
        message: '微信绑定 code 不能为空',
      });
    }

    const session = await getWechatSession(code);
    const openid = session.openid;

    if (!openid) {
      return res.status(400).json({
        code: 400,
        message: '微信绑定失败，未获取到 openid',
      });
    }

    const occupiedUser = await User.findOne({ where: { wechatOpenId: openid } });
    if (occupiedUser && occupiedUser.id !== req.user.id) {
      return res.status(409).json({
        code: 409,
        message: '该微信已绑定其他账号',
      });
    }

    const currentUser = await User.findByPk(req.user.id);
    if (!currentUser) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
      });
    }

    currentUser.wechatOpenId = openid;
    await currentUser.save();

    return res.json({
      code: 200,
      message: '微信绑定成功',
      data: {
        userId: currentUser.id,
        wechatBound: true,
      },
    });
  } catch (error) {
    console.error('WeChat bind error:', error);
    return res.status(500).json({
      code: 500,
      message: error.message || '微信绑定失败',
    });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, role, phone, verifyCode } = req.body;

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

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({
        code: 409,
        message: '用户名已存在',
      });
    }

    const user = await User.create({ username, password, role, phone: phone || null });

    return res.json({
      code: 200,
      message: '注册成功',
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        phone: user.phone || '',
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名和密码不能为空',
      });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误',
      });
    }

    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误',
      });
    }

    return res.json({
      code: 200,
      message: '登录成功',
      data: buildAuthResponseData(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

module.exports = router;

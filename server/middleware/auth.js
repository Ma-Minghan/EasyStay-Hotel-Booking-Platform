const jwt = require('jsonwebtoken');

/**
 * JWT 验证中间件
 * 从 Authorization header 中提取并验证 token
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer token

  if (!token) {
    return res.status(401).json({
      code: 401,
      message: '缺少认证 token，请先登录',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // 将用户信息挂到 req.user
    next();
  } catch (error) {
    return res.status(403).json({
      code: 403,
      message: 'Token 过期或无效，请重新登录',
    });
  }
};

module.exports = { authenticateToken };

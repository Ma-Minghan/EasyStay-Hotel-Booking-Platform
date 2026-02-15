const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false, // 设置为 true 可看 SQL 执行日志
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// 测试连接
sequelize.authenticate()
  .then(() => console.log('✅ Database connection established successfully.'))
  .catch(err => console.error('❌ Unable to connect to the database:', err));

module.exports = sequelize;

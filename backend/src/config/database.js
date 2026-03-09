const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4',
      // 让 mysql2 将 DATE 列以字符串形式返回，避免 DATEONLY + 时区组合导致日期偏移
      dateStrings: ['DATE'],
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    },
    timezone: '+08:00',
  }
);

async function connectDB() {
  // 每个新连接建立后，显式设置 utf8mb4，防止连接池复用时字符集回退
  sequelize.addHook('afterConnect', (connection, _config) => {
    return new Promise((resolve, reject) => {
      connection.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci", (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
  await sequelize.authenticate();
  console.log('[db] MySQL connected successfully');
}

module.exports = { sequelize, connectDB };

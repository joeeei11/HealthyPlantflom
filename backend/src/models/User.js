const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: { args: [2, 50], msg: '用户名长度须在 2-50 字符之间' },
        notEmpty: { msg: '用户名不能为空' },
      },
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: '邮箱格式不正确' },
        notEmpty: { msg: '邮箱不能为空' },
      },
    },
    // 对应 DB 列 password_hash（underscored: true 自动映射）
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('student', 'counselor', 'school'),
      allowNull: false,
      validate: {
        isIn: { args: [['student', 'counselor', 'school']], msg: 'role 只能为 student/counselor/school' },
      },
    },
    isActive: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    avatarUrl: {
      type: DataTypes.STRING(255),
      defaultValue: null,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      defaultValue: null,
    },
  },
  {
    tableName: 'users',
    // timestamps: true 和 underscored: true 继承自 sequelize 实例全局 define 配置
  }
);

module.exports = User;

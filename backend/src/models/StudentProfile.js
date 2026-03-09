const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StudentProfile = sequelize.define(
  'StudentProfile',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    realName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: '真实姓名不能为空' },
      },
    },
    studentNo: {
      type: DataTypes.STRING(20),
      defaultValue: null,
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      defaultValue: null,
    },
    grade: {
      type: DataTypes.STRING(20),
      defaultValue: null,
    },
    major: {
      type: DataTypes.STRING(100),
      defaultValue: null,
    },
    college: {
      type: DataTypes.STRING(100),
      defaultValue: null,
    },
    phone: {
      type: DataTypes.STRING(20),
      defaultValue: null,
    },
    emergencyContact: {
      type: DataTypes.STRING(50),
      defaultValue: null,
    },
    emergencyPhone: {
      type: DataTypes.STRING(20),
      defaultValue: null,
    },
  },
  {
    tableName: 'student_profiles',
  }
);

module.exports = StudentProfile;

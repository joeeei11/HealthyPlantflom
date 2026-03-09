const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Appointment = sequelize.define(
  'Appointment',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    counselorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // DATE 类型，DATEONLY 对应 MySQL DATE
    appointmentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    // TIME 类型存为 'HH:MM:SS' 字符串
    startTime: {
      type: DataTypes.STRING(8),
      allowNull: false,
    },
    endTime: {
      type: DataTypes.STRING(8),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('online', 'offline'),
      allowNull: false,
      defaultValue: 'offline',
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show'),
      allowNull: false,
      defaultValue: 'pending',
    },
    reason: {
      type: DataTypes.TEXT,
      defaultValue: null,
    },
    cancelReason: {
      type: DataTypes.TEXT,
      defaultValue: null,
    },
    cancelledBy: {
      type: DataTypes.INTEGER,
      defaultValue: null,
    },
  },
  {
    tableName: 'appointments',
  }
);

module.exports = Appointment;

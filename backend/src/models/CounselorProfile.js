const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CounselorProfile = sequelize.define(
  'CounselorProfile',
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
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      defaultValue: null,
    },
    title: {
      type: DataTypes.STRING(50),
      defaultValue: null,
    },
    qualification: {
      type: DataTypes.STRING(255),
      defaultValue: null,
    },
    specialties: {
      type: DataTypes.JSON,
      defaultValue: null,
    },
    bio: {
      type: DataTypes.TEXT,
      defaultValue: null,
    },
    availableSlots: {
      type: DataTypes.JSON,
      defaultValue: null,
    },
    maxAppointmentsPerDay: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 8,
    },
    phone: {
      type: DataTypes.STRING(20),
      defaultValue: null,
    },
    isAccepting: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    tableName: 'counselor_profiles',
  }
);

module.exports = CounselorProfile;

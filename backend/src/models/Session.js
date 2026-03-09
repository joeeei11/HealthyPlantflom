const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Session = sequelize.define(
  'Session',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    appointmentId: {
      type: DataTypes.INTEGER,
      defaultValue: null,
      unique: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    counselorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('individual', 'online'),
      allowNull: false,
      defaultValue: 'individual',
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'in_progress',
    },
    startedAt: {
      type: DataTypes.DATE,
      defaultValue: null,
    },
    endedAt: {
      type: DataTypes.DATE,
      defaultValue: null,
    },
  },
  {
    tableName: 'sessions',
  }
);

module.exports = Session;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SessionNote = sequelize.define(
  'SessionNote',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    counselorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    riskLevel: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'crisis'),
      allowNull: false,
      defaultValue: 'low',
    },
    followUpRequired: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    isPrivate: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    tableName: 'session_notes',
  }
);

module.exports = SessionNote;

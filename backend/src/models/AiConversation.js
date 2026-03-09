const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AiConversation = sequelize.define(
  'AiConversation',
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
    title: {
      type: DataTypes.STRING(255),
      defaultValue: null,
    },
    status: {
      type: DataTypes.ENUM('active', 'archived'),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    tableName: 'ai_conversations',
  }
);

module.exports = AiConversation;

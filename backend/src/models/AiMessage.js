const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AiMessage = sequelize.define(
  'AiMessage',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('user', 'assistant'),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    tokensUsed: {
      type: DataTypes.INTEGER,
      defaultValue: null,
    },
  },
  {
    tableName: 'ai_messages',
    updatedAt: false,
  }
);

module.exports = AiMessage;

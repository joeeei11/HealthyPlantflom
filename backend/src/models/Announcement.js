const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Announcement = sequelize.define(
  'Announcement',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    targetRole: {
      type: DataTypes.ENUM('all', 'student', 'counselor'),
      allowNull: false,
      defaultValue: 'all',
    },
    isPinned: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: 'announcements',
  }
);

module.exports = Announcement;

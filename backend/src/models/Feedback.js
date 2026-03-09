const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Feedback = sequelize.define(
  'Feedback',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sessionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    rating: {
      type: DataTypes.TINYINT,
      allowNull: false,
      validate: {
        min: { args: [1], msg: '评分最低为 1' },
        max: { args: [5], msg: '评分最高为 5' },
      },
    },
    content: {
      type: DataTypes.TEXT,
      defaultValue: null,
    },
    isAnonymous: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'feedback',
  }
);

module.exports = Feedback;



import { DataTypes, Model } from 'sequelize';
import sequelize from './sequalise';

class UserYtUser extends Model {
  public id!: number;
  public userId!: number;
  public ytUserId!: number;
  public role?: string; // optional: 'owner', 'editor', etc.
}

UserYtUser.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  ytUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'UserYtUser',
  timestamps: false,
});

export { UserYtUser };


import { DataTypes, Model } from 'sequelize';
import sequelize from './sequalise';

class User extends Model {
  public id!: number;
  public googleId!: string;
  public name!: string;
  public email!: string;
  public refreshToken!: string;

  
}

User.init({
  googleId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
  },
  refreshToken: {
    type: DataTypes.TEXT,
  },
}, {
  sequelize,
  modelName: 'User',
});


async function findOrCreateFromGoogle(googleData: any, tokens: any) {
  return await User.upsert({
    googleId: googleData.id,
    name: googleData.name,
    email: googleData.email,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
  });
}

export { User, findOrCreateFromGoogle };
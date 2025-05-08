import { DataTypes, Model } from 'sequelize';
import sequelize from './sequalise';

class Categories extends Model {
  public id!: number;
  public name!: string;
  public categoriser!: string;
}

const CategoriesModel = Categories.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  categoriser: {
    type: DataTypes.STRING,
    defaultValue: "bay",
  }
}, {
  sequelize,
  modelName: 'Categories',
});

export { Categories };
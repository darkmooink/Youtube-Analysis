import { DataTypes, Model } from 'sequelize';
import sequelize from '../data/sequalise';

class Categorisation extends Model {
  public id!: number;
  public commentId!: number;
  public categoryId!: number;
  public userId!: number;
}

const CategorisationModel = Categorisation.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  commentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'Categorisation',
  timestamps: true, // Automatically adds createdAt and updatedAt
});


export { Categorisation };
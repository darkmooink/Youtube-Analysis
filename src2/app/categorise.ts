

import { DataTypes, Model } from 'sequelize';
import sequelize from '../data/sequalise';
import { Comment } from '../data/comments';
import { Categories } from '../data/categories';
import { User } from '../data/user';

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

// Associations
Categorisation.belongsTo(Comment, { foreignKey: 'commentId' });
Categorisation.belongsTo(Categories, { foreignKey: 'categoryId' });
Categorisation.belongsTo(User, { foreignKey: 'userId' });

Comment.hasMany(Categorisation, { foreignKey: 'commentId' });
Categories.hasMany(Categorisation, { foreignKey: 'categoryId' });
User.hasMany(Categorisation, { foreignKey: 'userId' });

export { Categorisation };
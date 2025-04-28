import sequelize from './sequalise';
import './user';
import './comments';
import './categories';
import './categorisations';

import { Categorisation } from './categorisations';
import { Comment } from './comments';
import { Categories } from './categories';
import { User } from './user';

// Setup Associations
Categorisation.belongsTo(Comment, { foreignKey: 'commentId' });
Categorisation.belongsTo(Categories, { foreignKey: 'categoryId' });
Categorisation.belongsTo(User, { foreignKey: 'userId' });

Comment.hasMany(Categorisation, { foreignKey: 'commentId' });
Categories.hasMany(Categorisation, { foreignKey: 'categoryId' });
User.hasMany(Categorisation, { foreignKey: 'userId' });

const syncPromise = sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synced');
  })
  .catch(err => {
    console.error('Database sync error:', err);
  });

export default syncPromise; 
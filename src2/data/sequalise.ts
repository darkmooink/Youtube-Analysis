import { Sequelize } from 'sequelize';
import path from 'path';

// Create a new Sequelize instance with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: process.env.NODE_ENV !== 'production' ? false : false,
  
});
 sequelize.sync({ force: true });
export default sequelize;

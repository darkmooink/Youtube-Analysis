import sequelize from './sequalise';
import './user'; // ensure the model is registered
import './comments'
// import './data/associations'; // if you have one

const syncPromise = sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synced');
  })
  .catch(err => {
    console.error('Database sync error:', err);
  });

export default syncPromise;
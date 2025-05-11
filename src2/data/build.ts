import sequelize from './sequalise';
import './user';
import './comment';
// import './categories';
// import './categorisations';
import './channel';
// import './userYtUser';
import './openAIModerator'
import './playlist'
import './video'

// import { Categorisation } from './categorisations';
import { Comment } from './comment';
// import { Categories } from './categories';
import { User } from './user';
import { Channel } from './channel';
import { Playlist } from './playlist';
import { Video } from './video';


// Setup Associations
// Categorisation.belongsTo(Comment, { foreignKey: 'commentId' });
// Categorisation.belongsTo(Categories, { foreignKey: 'categoryId' });
// Categorisation.belongsTo(User, { foreignKey: 'userId' });

// Comment.hasMany(Categorisation, { foreignKey: 'commentId' });
// Categories.hasMany(Categorisation, { foreignKey: 'categoryId' });
// User.hasMany(Categorisation, { foreignKey: 'userId' });

Comment.belongsTo(Channel, {
  foreignKey: 'authorId',
  as: 'author',
});

Channel.hasMany(Comment, {
  foreignKey: 'authorId',
  as : 'commentsMade',});


Video.belongsTo(Channel, { foreignKey: 'authorId', as: 'author' });
Channel.hasMany(Video, { foreignKey: 'authorId', as: 'videos' });

Video.hasMany(Comment,{foreignKey:'videoId', as:'comments'})
Comment.belongsTo(Video,{foreignKey:'videoId', as:'video'})

Channel.hasOne(Playlist, {
  foreignKey: 'uploadsPlaylistId',
  as: 'uploadsPlaylist',
});
Channel.hasMany(Playlist, {
  foreignKey: 'authorId',
  as: 'playlists',
});
Playlist.belongsTo(Channel, { foreignKey: 'authorId', as: 'author'});
Playlist.belongsTo(Channel, {
  foreignKey: 'uploadsPlaylistId',
  as: 'uploader',
});



const syncPromise = sequelize.sync({  force: true })
  .then(() => {
    console.log('Database synced');
  })
  .catch(err => {
    console.error('Database sync error:', err);
  });

export default syncPromise; 
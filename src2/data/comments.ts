import { DataTypes, Model } from 'sequelize';
import sequelize from './sequalise';

class Comment extends Model {
  public id!: string;
  public videoId!: string;
  public parentId!: string | null;
  public author!: string;
  public text!: string;
  public etag!: string;
  public publishedAt!: Date;

  
}

const CommentModel = Comment.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  videoId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  parentId: {
    type: DataTypes.STRING,
    allowNull: true, // null = top-level
  },
  author: DataTypes.STRING,
  text: DataTypes.TEXT,
  etag: DataTypes.STRING,
  publishedAt: {type:DataTypes.DATE,allowNull:true},
}, {
  sequelize,
  modelName: 'Comment',
});
 async function commentToDB(comment: any, videoId: string) {
    return await Comment.upsert({
      id: comment.id,
      videoId,
      parentId:comment.snippet?.parentId,
      author: (comment.snippet?.authorChannelId??{value:null}).value ?? null,
      text: comment.snippet?.textDisplay,
      textO: comment.snippet?.textOriginal,
      etag: comment.etag,
      publishedAt: comment.snippet?.publishedAt ? new Date(comment.snippet.publishedAt) : null,
    });
  }
export { Comment, commentToDB };
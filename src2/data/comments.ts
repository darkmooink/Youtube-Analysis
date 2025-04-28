import { DataTypes, Model } from 'sequelize';
import sequelize from './sequalise';
import getCommentsForVideo from "../services/google/youTube/comment";
import { OAuth2Client } from 'google-auth-library';
import "../services/google/youTube/comment"

class Comment extends Model {
  public id!: number;
  public youtubeId!: string;
  public videoId!: string;
  public parentId!: string | null;
  public author!: string;
  public text!: string;
  public originalText!:string;
  public etag!: string;
  public publishedAt!: Date;

  
}

const CommentModel = Comment.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    youtubeId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Make sure no duplicate YouTube comments
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
    originalText: DataTypes.TEXT,
    etag: DataTypes.STRING,
    publishedAt: {type:DataTypes.DATE,allowNull:true},
}, {
    sequelize,
    modelName: 'Comment',
});
async function commentToDB(comment: any, videoId: string) {
    return await Comment.upsert({
        youtubeId: comment.id,
        videoId,
        parentId:comment.snippet?.parentId,
        author: (comment.snippet?.authorChannelId??{value:null}).value ?? null,
        text: comment.snippet?.textDisplay,
        originalText: comment.snippet?.textOriginal,
        etag: comment.etag,
        publishedAt: comment.snippet?.publishedAt ? new Date(comment.snippet.publishedAt) : null,
    });
}
async function fromVideo(googleSession: OAuth2Client, videoId: string, query?: any) {
  const comments = await getCommentsForVideo(googleSession, videoId);

  for (const comment of comments) {
    await commentToDB(comment,videoId)
  }
  return Comment.findAll({where:{videoId:videoId}})
}
export { Comment, commentToDB, fromVideo };
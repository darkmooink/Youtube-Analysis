import { DataTypes, Model } from 'sequelize';
import sequelize from './sequalise';
import getCommentsForVideo from "../services/google/youTube/comment";
import { OAuth2Client } from 'google-auth-library';
import "../services/google/youTube/comment"
import { createYouTubeClient } from '../services/google/youTube/youtube';
import { youtube_v3 } from 'googleapis';

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
  public archive!: JSON[];
  public edited?:Date


static async  fromVideo(videoId: string, youTube?: youtube_v3.Youtube) {
    let log = ""
    if (youTube) {
        const comments = await getCommentsForVideo(youTube, videoId);
        for (const comment of comments) {
            await commentToDB(comment,videoId)
        }
        log = `Fetched ${comments.length} comments for video ${videoId}`;
    }

    const dbcomments = Comment.findAll({where:{videoId:videoId}})
    console.log(`${log} ${(await dbcomments).length} db comments`)
    return dbcomments
}

  
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
    edited: {type:DataTypes.DATE,allowNull:true},
}, {
    sequelize,
    modelName: 'Comment',
});
async function commentToDB(comment: any, videoId: string) {
    const oldComment = (await Comment.findOne({where:{youtubeId:comment.id}}))?? new Comment({
        youtubeId: comment.id,
        videoId,
        parentId:comment.snippet?.parentId,
        author: (comment.snippet?.authorChannelId??{value:null}).value ?? null,
        text: comment.snippet?.textDisplay,
        originalText: comment.snippet?.textOriginal,
        etag: comment.etag,
        publishedAt: comment.snippet?.publishedAt ? new Date(comment.snippet.publishedAt) : null,
        edited:comment.snippet?.updatedAt ? new Date(comment.snippet.updatedAt) : null,
        archive:[comment],
    })
    if (oldComment.etag != comment.etag){
        oldComment.archive = Array.isArray(oldComment.archive) ? [comment, ...oldComment.archive] : [comment];
        oldComment.text = comment.snippet?.textDisplay ?? oldComment.text;
        oldComment.originalText = comment.snippet?.textOriginal ?? oldComment.originalText;
        oldComment.etag = comment.etag ?? oldComment.etag;
        oldComment.publishedAt = comment.snippet?.publishedAt ? new Date(comment.snippet.publishedAt) : oldComment.publishedAt;
        oldComment.edited = comment.snippet?.updatedAt ? new Date(comment.snippet.updatedAt) : oldComment.edited;
    }
    await oldComment.save();
}
async function fromVideo(googleSession: OAuth2Client, videoId: string, query?: any) {
    const youTube = createYouTubeClient(googleSession);
    return Comment.fromVideo(videoId, youTube)
}
export { Comment, commentToDB, fromVideo };
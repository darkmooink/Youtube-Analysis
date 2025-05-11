import { DataTypes, Model } from 'sequelize';
import sequelize from './sequalise';
import { OAuth2Client } from 'google-auth-library';
import "../services/google/youTube/comment"
import { youtube_v3 } from 'googleapis';
import { Channel } from './channel';
import { Video } from './video';
import { getCommentsByVideoId } from '../services/google/youTube/comment';

class Comment extends Model {
    public id!: string;
    public videoId!: string;
    public parentId!: string | null;
    public authorId!: string;
    public text!: string;
    public originalText!:string;
    /*
    * if top level comment, this is the etag of the commentThread
    * if reply, this is the etag of the comment
    * */
    public etag!: string;
    public publishedAt!: Date;
    public archive!: youtube_v3.Schema$Comment[];
    public edited!:Date|null
    public lastCheckedAt!: Date;
    public recheckInterval!: number;
    public replyCount!: number;
    


    public static buildFromYoutubeComment(yt_comment: youtube_v3.Schema$Comment, db_comment?:Comment): Partial<Comment> {
        const comment:Partial<Comment> = {id : yt_comment.id!};
        comment.videoId = yt_comment.snippet?.videoId!;
        comment.parentId = yt_comment.snippet?.parentId || null;
        comment.authorId = yt_comment.snippet?.authorChannelId?.value!;
        comment.text = yt_comment.snippet?.textDisplay!;
        comment.originalText = yt_comment.snippet?.textOriginal!;
        comment.publishedAt = new Date(yt_comment.snippet?.publishedAt!);
        comment.edited = new Date(yt_comment.snippet!.updatedAt!);
        comment.archive = [yt_comment];
        comment.etag = yt_comment.etag!;
        comment.lastCheckedAt = new Date();
        return comment;
            
    }
    public static buildFromYoutubeCommentThread(yt_commentThread: youtube_v3.Schema$CommentThread, db_comment?:Comment): Partial<Comment> {
        const comment = Comment.buildFromYoutubeComment(yt_commentThread.snippet?.topLevelComment!);
        comment.etag = yt_commentThread.etag!;
        comment.replyCount = yt_commentThread.snippet?.totalReplyCount!;
        return comment;
    }
    static async saveFromYoutubeThreads(yt_commentThreads: youtube_v3.Schema$CommentThread[], db_comments?: Comment[]) {
        if (!db_comments) {
            db_comments = await Comment.findAll({
                where: {
                    id: yt_commentThreads.map(comment => comment.id),
                },
            });
        }
        const commentsToSave: Partial<Comment>[] = [];
        for (const yt_commentThread of yt_commentThreads) {
            const db_comment = db_comments?.find(comment => comment.id === yt_commentThread.snippet?.topLevelComment?.id);
            if (db_comment?.etag === yt_commentThread.etag) {
                continue; // No changes, skip
            }
            commentsToSave.push(Comment.buildFromYoutubeCommentThread(yt_commentThread));
            for (const reply of yt_commentThread.replies?.comments || []) {
                commentsToSave.push(Comment.buildFromYoutubeComment(reply));
            }
        }
        return await Comment.bulkCreate(commentsToSave, { updateOnDuplicate: ['text', 'originalText', 'etag', 'publishedAt', 'edited', 'archive', 'lastCheckedAt', 'replyCount'] });
    }

    static async  fromVideo(videoId: string, youTube?: youtube_v3.Youtube) {
        let log =""
        let db_comments = await Comment.findAll({where:{videoId:videoId}})
        if (!youTube) {
            return db_comments
        } else {
            try {
                const video = await Video.getFromId(videoId, youTube)!;
                if (!video) {
                    throw new Error(`Video with ID ${videoId} not found`);
                }
                const topLevelComments = db_comments.filter(comment => comment.parentId === null);
                const topLevelCommentIds = topLevelComments.map(comment => comment.id);
                if (topLevelComments.length >= video?.commentCount) {
                    return db_comments
                }

                console.log(`Fetching comments for video ${videoId}`);
                if (video.lastChecked < new Date(Date.now() - video.recheckInterval * 1000)) {
                    video.commentLastPageToken = undefined;
                }
                const yt_comments = await getCommentsByVideoId(youTube, videoId, video?.commentLastPageToken);
                video.commentLastPageToken = yt_comments.nextPageToken;
                video.lastChecked = new Date();
                // extracting all author channel id from top level comments and replies
                const topauthors = yt_comments.comments.map(comment => comment.snippet?.topLevelComment?.snippet?.authorChannelId?.value);
                const replyauthors  = yt_comments.comments
                    .filter(comment => comment.replies?.comments)
                    .map(comment => comment.replies!.comments!.map(reply => reply.snippet?.authorChannelId?.value))
                    .flat();
                const authors = ([...topauthors,...replyauthors].filter((value, index, self) => {
                    return self.indexOf(value) === index;
                })).filter((value) => value !== undefined) as string[];
                console.log(`Fetching channels for ${authors} authors`)
                console.time('fromVideo');
                await Channel.getChannelByIds(authors, youTube)
                console.timeEnd('fromVideo');
                video.save();
                await Comment.saveFromYoutubeThreads(yt_comments.comments, db_comments);
                return Comment.findAll({where:{videoId:videoId}})




                
            


                // under here is he old code.
                // const comments = await getCommentsForVideo(youTube, videoId);
                // for (const comment of comments) {
                //     await commentToDB(comment,videoId)
                // }
                // log = `Fetched ${comments.length} comments for video ${videoId}`;
            } catch (error) {
                console.error(`Error fetching comments for video ${videoId}:`, error);
                log = `Error fetching comments for video ${videoId}: ${error}`;
            }
        }

        const dbcomments = Comment.findAll({where:{videoId:videoId}})
        console.log(`${log} ${(await dbcomments).length} db comments`)
        return dbcomments
    }


    // static async getCommentersForChannel(ChannelID:string, youTube?: youtube_v3.Youtube) {
    //     if (youTube) {
    //         const missingCommenters = await Comment.findAll({
    //             include: [
    //                 {
    //                     model: Video,
    //                     attributes: [], 
    //                     required: true,
    //                     where: { channelId: ChannelID },
    //                 },
    //                 {
    //                     model: Channel,
    //                     attributes: [],
    //                     required: false
    //                 },
    //             ],
    //             where: {
    //                 '$Channel.youtubeChannelId$': null,
    //             },
    //             group: ['Comment.author'],
    //         });
    //         const missingCommenterIds = missingCommenters.map(commenter => commenter.author);
    //         const newChanels = await getChannelsById(youTube, missingCommenterIds);
    //         const channelsTobuild: Partial<Channel>[] = [];
    //         for (const channel of newChanels) {
    //             const channelId = channel.id!;
    //             const channelName = channel.snippet?.title!;
    //             const channelDescription = channel.snippet?.description!;
    //             const channelSubscriberCount = parseInt(channel.statistics?.subscriberCount || "-1");
    //             const channelArchive = channel!;
    //             const channelCreated = new Date(channel.snippet?.publishedAt!);
    //             const channelEtag = channel.etag!;
    //             const channelStatus = 1;
    //             const channelLastChecked = new Date();
    //             const channelLastActivity = undefined;
    //             channelsTobuild.push({
    //                 youtubeChannelId: channelId,
    //                 channelName: channelName,
    //                 channelDescription: channelDescription,
    //                 subscriberCount: channelSubscriberCount,
    //                 archive: [channelArchive],
    //                 created: channelCreated,
    //                 etag: channelEtag,
    //                 status: channelStatus,
    //                 lastCheckedAt: channelLastChecked,
    //                 lastActivityAt: channelLastActivity,
    //             });
    //         }
    //         Channel.bulkCreate(channelsTobuild, { ignoreDuplicates: true });
                
    //         for (const commenter of missingCommenters) {

    //             console.log(`Fetching channel name for ${commenter.author}`)

    //         }
    //     }
    //     const commenters = await Channel.findAll({
    //         include: [{
    //             model: Comment,
    //             required: true,
    //             include: [{
    //                 model: Video,
    //                 required: true,
    //                 where: { channelId: ChannelID }
    //             }]
    //         }],
    //         group: ['Channel.youtubeChannelId'],
    //     })
        
    //     return commenters
    // }

  
}

const CommentModel = Comment.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        unique: true,
    },
    videoId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    parentId: {
        type: DataTypes.STRING,
        allowNull: true, // null = top-level
    },
    archive: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        // set(value: youtube_v3.Schema$Comment[]) {
        //     if (!this.archive[0]){
        //         this.setDataValue('archive', value);
        //         return;
        //     }
        //     if (value[0]?.etag !== this.archive[0].etag) {
        //         const currentArchive = this.getDataValue('archive') || [];
        //         this.setDataValue('archive', [...value, ...currentArchive]);
        //     }
        // },
    },
    authorId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    originalText: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    etag: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    publishedAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    edited: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
    lastCheckedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: () => new Date(),
    },
    recheckInterval: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 86400,
    },
    replyCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
}, {
    sequelize,
    modelName: 'Comment',
});

export { Comment };
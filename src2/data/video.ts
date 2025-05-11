import { DataTypes, Model } from 'sequelize';
import sequelize from './sequalise';
import { options } from '../types';
import { Playlist } from './playlist';
import { createYouTubeClientFromOptions, createYouTubeClientWithKey } from '../services/google/youTube/youtube';
import { getAllPlaylistItems } from '../services/google/youTube/playlistItems';
import { getVideosDetails } from '../services/google/youTube/video';
import { youtube_v3 } from 'googleapis';
import { Channel } from './channel';
export class Video extends Model {
    public id!: string;
    /*
    * The channelId of the video
    */
    public authorID!: string;
    public title!: string;
    public description!: string;
    public publishedAt!: Date;
    public lastChecked!: Date;
    public archive!: youtube_v3.Schema$Video[];
    public etag!: string;
    public commentCount!: number;
    public commentLastPageToken?: string;
    /*
    * The interval in seconds to recheck the playlist
    * @default 86400
    */
    public recheckInterval!:number
    /**
     * @deprecated This method is deprecated and not compatible with the new structure.
     * Please use the updated methods for fetching videos by channelId.
     */
    public static async getByChannelId(channelId: string, options?: options & {get:boolean, archive:boolean}): Promise<Video[]> {
        console.warn('Video.getByChannelId is deprecated and not compatible with the new structure.');
        return [];
    }
    public static async getFromId(id: string, youtube:youtube_v3.Youtube): Promise<Video> {
        if (!id) throw new Error("Video has no youtubeId");
        let db_video = await Video.findByPk(id);

        if (db_video && db_video.lastChecked > new Date(Date.now() - 86400 * 1000)) return db_video;
        if (!youtube) {
            youtube = createYouTubeClientWithKey();
        }
        const yt_video = (await getVideosDetails(youtube, [id]))[0];
        if (!yt_video) {
            throw new Error(`Video with ID ${id} not found`);
        }
        if (!db_video) {
            await Channel.getChannelById(yt_video.snippet?.channelId || "", youtube);
            db_video = await Video.saveFromYoutube(yt_video);
        }else {

            db_video = await Video.saveFromYoutube(yt_video, db_video);
        }
        return db_video!;

    }
    public static async saveFromYoutube(yt_video: youtube_v3.Schema$Video, db_video?: Video): Promise<Video> {
        if (!db_video) {
            if (!yt_video.id) {
                throw new Error("Video ID is required to save video data");
            }
            db_video = Video.build({ id: yt_video.id });
        }
        db_video.title = yt_video.snippet?.title || db_video.title || "";
        db_video.authorID = yt_video.snippet?.channelId || db_video.authorID || "";
        db_video.description = yt_video.snippet?.description || db_video.description || "";
        db_video.publishedAt = yt_video.snippet?.publishedAt ? new Date(yt_video.snippet.publishedAt) : db_video.publishedAt || new Date();
        db_video.commentCount = yt_video.statistics?.commentCount ? parseInt(yt_video.statistics.commentCount) : db_video.commentCount || 0;
        db_video.lastChecked = new Date();

        if (yt_video.etag !== db_video.etag) {
            db_video.archive = [yt_video, ...(db_video.archive|| [])];
            db_video.etag = yt_video.etag!;
        }


        await db_video.save();
        return db_video;
  }
}
Video.init({
    id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
    },
    authorId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    publishedAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    lastChecked: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: null,
    },
    archive: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
    etag: {
        type: DataTypes.STRING,
        allowNull: false
    },
    commentCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    recheckInterval: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 86400
    },
    commentLastPageToken: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
}, {
    sequelize,
    modelName: 'Video',
    timestamps: true,
});
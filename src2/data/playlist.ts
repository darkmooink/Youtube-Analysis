import { DataTypes, FindOptions, Model, Sequelize } from 'sequelize';
import sequelize from './sequalise';
import { youtube_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { createYouTubeClient, createYouTubeClientFromOptions, createYouTubeClientWithKey } from '../services/google/youTube/youtube';
import { getPlaylistsDetails } from '../services/google/youTube/playlist';
import { Channel } from './channel';
import { options } from '../types'
import { getAllPlaylistItems } from '../services/google/youTube/playlistItems';
export class Playlist extends Model{
    public Id!:string;
    public title!:string;
    public author!:string;
    public lastChecked!:Date;
    public priority!:number;
    public size!:number;
    public videos!:youtube_v3.Schema$PlaylistItem[];
    public etag!:string;
    /*
    * The interval in seconds to recheck the playlist
    * @default 86400
    */
    public recheckInterval!:number

    public static async getFromId(id:string, youtube?:youtube_v3.Youtube):Promise<Playlist>{
        if(!id) throw new Error("Playlist has no youtubeId")
        let db_playlist = await Playlist.findByPk(id)
        
        if(db_playlist && db_playlist.lastChecked > new Date(Date.now() - db_playlist.recheckInterval * 1000) ) return db_playlist
        
        if(!youtube) {
            youtube = createYouTubeClientWithKey()
        }
        const yt_playlist = (await getPlaylistsDetails(youtube, [id]))[0]
        if (!yt_playlist) {
            throw new Error(`Playlist with ID ${id} not found`);
        }
        if (!db_playlist) {
            await Channel.getChannelById(yt_playlist.snippet?.channelId || "", youtube)
            db_playlist = Playlist.build({ Id: yt_playlist.id });
        }
        db_playlist = await Playlist.saveFromYoutube(yt_playlist, db_playlist)
        await db_playlist.getVideos(youtube)

        return db_playlist

    }
    public async getVideos(youtube?:youtube_v3.Youtube):Promise<youtube_v3.Schema$PlaylistItem[]>{
        if(!youtube || this.videos.length == this.size) return this.videos
        this.videos = await getAllPlaylistItems(youtube, this.Id)
        this.size = this.videos.length
        await this.save()
        return this.videos
    }


    static async saveFromYoutube(yt_playlist:youtube_v3.Schema$Playlist, db_playlist?:Playlist|null):Promise<Playlist> {
        if (!db_playlist) {
            if (!yt_playlist.id) {
                throw new Error("Playlist ID is required to save playlist data");
            }
            db_playlist = Playlist.build({ Id: yt_playlist.id });
        }
        db_playlist.title = yt_playlist.snippet?.title || db_playlist.title || "";
        db_playlist.author = yt_playlist.snippet?.channelId || db_playlist.author || "";
        db_playlist.lastChecked = new Date();
        db_playlist.priority = 0;
        db_playlist.size = yt_playlist.contentDetails?.itemCount || -1;
        db_playlist.videos = [];
        db_playlist.etag = yt_playlist.etag || db_playlist.etag || "";
        await db_playlist.save();
        return db_playlist
    }
}
Playlist.init({
    Id:{
        type:DataTypes.STRING,
        primaryKey:true,
    },
    type:DataTypes.STRING,
    author:DataTypes.STRING,
    lastChecked: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    },
    priority:{
        type:DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
    },
    size:{
        type:DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
    },

    recheckInterval:{
        type:DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 86400
    },
    videos:{
        type: DataTypes.JSONB,
        defaultValue: []
    },
    etag:{
        type: DataTypes.STRING,
        allowNull: false,
    }

}, {
  sequelize,
  modelName: 'Playlist',
  timestamps: true,
})

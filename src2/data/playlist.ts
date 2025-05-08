import { DataTypes, FindOptions, Model, Sequelize } from 'sequelize';
import sequelize from './sequalise';
import { youtube_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { createYouTubeClient, createYouTubeClientFromOptions, createYouTubeClientWithKey } from '../services/google/youTube/youtube';
import { getPlaylistsDetails } from '../services/google/youTube/playlist';
import { Channel } from './channel';
import { options } from '../types'
export class Playlist extends Model{
    public youtubeId!:string;
    public type!:string;
    public author?:string;
    public lastChecked?:Date;
    public priority!:number
    public size?:number

    async getvideos(options?:options){
        if(!this.youtubeId) throw new Error("Playlist has no youtubeId")
        if(options){
            options= createYouTubeClientFromOptions(options)
        }else{
            throw new Error("Options are required")
        }
        const playlistItems = await options?.youtube?.playlistItems.list({
            part: ['snippet'],
            maxResults: 50,
            playlistId: this.youtubeId,
        })
        return playlistItems?.data.items
    }

    static async getByChannelId(channelId:string, options?:{youtube?:youtube_v3.Youtube, auth?:OAuth2Client, query?:FindOptions<Playlist>}):Promise<Playlist[]>{
        const playlists = await Playlist.findAll({
            ...(options?.query || {}),
            where: {
              ...(options?.query?.where || {}),
              author: channelId
            }
          });
        //todo: check if the lastChecked is older than 1 day for  each playlist
        if(playlists.length>0)return playlists
        return Playlist.createFromDBChannel((await Channel.getChannelById(channelId,options))!, options)
    }
    static async createFromDBChannel(channel:Channel, options?:{youtube?:youtube_v3.Youtube, auth?:OAuth2Client}):Promise<Playlist[]>{
        if (!channel.archive || channel.archive.length == 0){
            channel = (await Channel.getChannelById(channel.youtubeChannelId))!
        }
        return this.createFromYTChannel(channel.archive![0],options)
    }
        
    static async createFromYTChannel(channel:youtube_v3.Schema$Channel, options?:{youtube?:youtube_v3.Youtube, auth?:OAuth2Client}):Promise<Playlist[]>{
        
        if(options && !options.youtube && options.auth){
                options.youtube = createYouTubeClient(options.auth)
        }
        await Channel.getChannelById(channel.id!,options)
        if(!channel.contentDetails?.relatedPlaylists){
            console.warn(`channel ${channel.id} ${channel.snippet?.title} is missing playlists`)
            return []
        }
        let playlistsToUpdate:Promise<[Playlist, boolean | null]>[] = []
        for (const [key, playlistId] of Object.entries(channel.contentDetails.relatedPlaylists)) {
            if (!playlistId) continue;
            console.log(`Type: ${key}, Playlist ID: ${playlistId}, author: ${channel.id}`);
            const existing = await Playlist.findByPk(playlistId)
            const playlist = Playlist.upsert({
                youtubeId: playlistId,
                type: key,
                author: channel.id
            });

            if(!existing || existing.lastChecked == null){
                playlistsToUpdate.push(playlist)
                
            }
        }
        if (playlistsToUpdate.length>0 && options?.youtube){
            for(const playlist of playlistsToUpdate){
                const pl = await playlist
                if (pl[0] instanceof Playlist) {
                    await pl[0].updateFromYT(options);
                }
                
            }
        } 
        const playlists = await Playlist.findAll({where:{author:channel.id}})
        return playlists
    }

    public async updateFromYT(options:options){
        try{
            options = createYouTubeClientFromOptions(options)
            const playlistFromYoutube = await options.youtube?.playlists.list({
                part:["contentDetails"],
                id:[this.youtubeId]
            })
            const items = playlistFromYoutube?.data.items
            const firstitem = items![0]
            const count = firstitem.contentDetails?.itemCount
            this.size = count!
            this.lastChecked = new Date()
            this.save()
        }catch (error){
            console.log(`playlist update error happened`, error)
        }
    }
}
Playlist.init({
    youtubeId:{
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

}, {
  sequelize,
  modelName: 'Playlist',
  timestamps: true,
})

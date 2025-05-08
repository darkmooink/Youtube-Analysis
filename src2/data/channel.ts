import { DataTypes, Model, where } from 'sequelize';
import sequelize from './sequalise';
import { OAuth2Client } from 'google-auth-library';
import { youtube_v3 } from 'googleapis';
import { createYouTubeClient } from '../services/google/youTube/youtube';
import { getChannelsById } from '../services/google/youTube/channel';
import { Playlist } from './playlist';


class Channel extends Model {
  public youtubeChannelId!: string;
  public channelName!: string;
  public channelDescription!: string;
  public lastCheckedAt!: Date;
  public subscriberCount!: number;
  public archive?: youtube_v3.Schema$Channel[];
  public created!: Date;
  public etag!: string;
  public lastActivityAt?: Date;
  public status!: number;



  static async saveFromYoutube(ytChannel:youtube_v3.Schema$Channel):Promise<Channel> {
    const channelID = ytChannel.id
    let fromDB = await Channel.findOne({where:{youtubeChannelId:channelID}})
    if (!fromDB) {
      fromDB = Channel.build({ youtubeChannelId: channelID });
      Playlist.createFromYTChannel(ytChannel)
    }
    
    fromDB.channelName = ytChannel.snippet?.title || fromDB.channelName;
    fromDB.channelDescription = ytChannel.snippet?.description || fromDB.channelDescription;
    fromDB.lastCheckedAt = new Date();
    fromDB.subscriberCount = parseInt(ytChannel.statistics?.subscriberCount || "-1");
    fromDB.etag = ytChannel.etag || fromDB.etag;
    fromDB.lastActivityAt = ytChannel.snippet?.publishedAt ? new Date(ytChannel.snippet.publishedAt) : fromDB.lastActivityAt;
    fromDB.status = fromDB.status ?? 1;
    
    // Archive logic
    fromDB.archive = fromDB.archive ? [ytChannel, ...fromDB.archive] : [ytChannel];
    
    await fromDB.save();
    return fromDB
  }

  static async getChannelById(ytChannelId:string, options?:{youtube?:youtube_v3.Youtube, auth?:OAuth2Client, refresh?:boolean}) {
    let fromDB:Channel|null = null
    if(!options?.refresh){
      fromDB = await Channel.findOne({where:{youtubeChannelId:ytChannelId}})
    }
    if(fromDB && fromDB.lastCheckedAt > new Date(Date.now() - 86400000) && !options?.refresh){
      return fromDB
    }
    if (!options || !(options?.auth || options?.youtube)){
      console.warn(`channel id ${ytChannelId} was attempted to be accessed without an auth method`)
      return fromDB
    }
    if (!options?.youtube) {
      if (!options?.auth) {
        throw new Error("Cannot create YouTube client: missing auth");
      }
      options.youtube = createYouTubeClient(options.auth);
    }
    fromDB = await Channel.saveFromYoutube((await getChannelsById(options.youtube, [ytChannelId]))[0])
    return fromDB
    
    

    
  }

}

Channel.init({
  youtubeChannelId: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey:true
  },
  channelName: {
    type: DataTypes.STRING,
  },
  channelDescription: {
    type: DataTypes.STRING,
  },
  lastCheckedAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  subscriberCount: {
    type: DataTypes.INTEGER,
  },
  archive: {
    type: DataTypes.JSON,
  },
  created: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  etag: {
    type: DataTypes.STRING,
  },
  lastActivityAt: {
    type: DataTypes.DATE,
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
}, {
  sequelize,
  modelName: 'Channel',
  timestamps: false,
});


export { Channel};
import { DataTypes, Model, where, Op } from 'sequelize';
import sequelize from './sequalise';
import { OAuth2Client } from 'google-auth-library';
import { youtube_v3 } from 'googleapis';
import { createYouTubeClient, createYouTubeClientWithKey } from '../services/google/youTube/youtube';
import { getChannelsById, getChannelByHandle } from '../services/google/youTube/channel';
import e from 'express';
import { generateImageHash, downloadImage } from '../utils/image';
// import { Playlist } from './playlist';


class Channel extends Model {
  public Id!: string;
  public Name!: string;
  public handle!: string;
  public Description!: string;
  public subscriberCount!: number;
  public archive!: youtube_v3.Schema$Channel[];
  public created!: Date;
  public etag!: string;
  public status!: number;
  public uploadsPlaylistId!: string;
  public videoCount!: number;
  public lastCheckedAt!: Date;
  /**
   * The interval in seconds to recheck the channel
   * @default 86400
   * @type {number}
   */
  public recheckInterval!: number;
  public profilePictureUrl?: string;
  public profilePictureHash?: string;

  async processProfilePicture():Promise<void> {
    if (!this.profilePictureUrl) {
      throw new Error("Profile picture URL is not set");
    }
    const imageBuffer = await downloadImage(this.profilePictureUrl);
    const hash = generateImageHash(imageBuffer);
    this.profilePictureHash = hash;
    this.save();
  }

  async howManyOtherChannelsHaveThisProfilePicture():Promise<number> {
    if (!this.profilePictureHash) {
      throw new Error("Profile picture hash is not set");
    }
    const channels = await Channel.findAll({
      where: {
        profilePictureHash: this.profilePictureHash,
        Id: {
          [Op.ne]: this.Id,
        },
      },
    });
    return channels.length;
  }


  static async saveFromYoutube(yt_Channel:youtube_v3.Schema$Channel, db_channel?:Channel):Promise<Channel> {
    if (!db_channel) {
      if (!yt_Channel.id) {
        throw new Error("Channel ID is required to save channel data");
      }
      db_channel = Channel.build({ Id: yt_Channel.id });
    }
    db_channel.Name = yt_Channel.snippet?.title || db_channel.Name || "";
    db_channel.handle = yt_Channel.snippet?.customUrl || db_channel.handle || "";
    db_channel.Description = yt_Channel.snippet?.description || db_channel.Description || "";
    db_channel.lastCheckedAt = new Date();
    db_channel.subscriberCount = parseInt(yt_Channel.statistics?.subscriberCount || "-1");
    db_channel.created = new Date(yt_Channel.snippet?.publishedAt || Date.now());
    db_channel.uploadsPlaylistId = yt_Channel.contentDetails?.relatedPlaylists?.uploads || db_channel.uploadsPlaylistId|| "";
    db_channel.videoCount = parseInt(yt_Channel.statistics?.videoCount || "-1");
    db_channel.status = db_channel.status ?? 1;
    
    // Archive logic
    if (!yt_Channel.etag) {
      console.warn(`Channel ${yt_Channel.id} has no etag`);
    }else if (yt_Channel.etag !== db_channel.etag) {
      let yt_profilePictureUrl = yt_Channel.snippet?.thumbnails?.default?.url || yt_Channel.snippet?.thumbnails?.high?.url || yt_Channel.snippet?.thumbnails?.medium?.url || undefined;
      if (yt_profilePictureUrl && db_channel.profilePictureUrl !== yt_profilePictureUrl) {
        db_channel.profilePictureUrl = yt_profilePictureUrl;
        db_channel.processProfilePicture();
      }

      db_channel.archive = db_channel.archive ? [yt_Channel, ...db_channel.archive] : [yt_Channel];
    }

    db_channel.etag = yt_Channel.etag || db_channel.etag || "";
    
    db_channel.save();
    return db_channel
  }

  static async getChannelById(Id:string, youtube?:youtube_v3.Youtube):Promise<Channel|null> {
    const db_channel = await Channel.findByPk(Id)
    if (db_channel){
      if (db_channel.lastCheckedAt > new Date(Date.now() - db_channel.recheckInterval * 1000)) {
        return db_channel
      }
    }
    if (!youtube) {
      youtube = createYouTubeClientWithKey()
    }
    const yt_channelData = await getChannelsById(youtube, [Id])
    if (yt_channelData.length > 0) {
      const yt_newChannelData = yt_channelData[0]
      if (db_channel) {
        return Channel.saveFromYoutube(yt_newChannelData, db_channel)
      } else {
        return Channel.saveFromYoutube(yt_newChannelData)
      }
    } else {
      console.warn(`Channel ${Id} not found on YouTube`)
      return null
    }
  }


  static async getChannelByIds(Id:string[], youtube?:youtube_v3.Youtube):Promise<Channel[]|null> {
    const db_channels = await Channel.findAll({
      where: {
        Id: {
          [Op.in]: Id,
        },
      },
    })

    const channelsNotInDb = Id.filter((Id) => !db_channels.some((channel) => channel.Id === Id))||[]

    const db_channelIdsToUpdate:string[] = db_channels.filter((channel) => { if (channel.lastCheckedAt > new Date(Date.now() - channel.recheckInterval * 1000)) {
      return false
    }
    return true
    }).map((channel) => channel.Id)
    if (channelsNotInDb.length == 0 && db_channelIdsToUpdate.length == 0) {
      return db_channels
    }
    if (!youtube) {
      youtube = createYouTubeClientWithKey()
    }
    const yt_channelsData = await getChannelsById(youtube, [...channelsNotInDb, ...db_channelIdsToUpdate])
    for (const yt_newChannelData of yt_channelsData) {
      const db_channel = db_channels.find((channel) => channel.Id === yt_newChannelData.id)
      if (db_channel) {
        await Channel.saveFromYoutube(yt_newChannelData, db_channel)
      }
      else {
        await Channel.saveFromYoutube(yt_newChannelData)
      }
    }
    return Channel.findAll({
      where: {
        Id: {
          [Op.in]: Id,
        },
      },
    })
  }

  static async getChannelByHandle(handle:string, youtube?:youtube_v3.Youtube):Promise<Channel|null> {
    const db_channel = await Channel.findOne({where:{handle:handle}})
    if (db_channel){
      if (db_channel.lastCheckedAt > new Date(Date.now() - db_channel.recheckInterval * 1000)) {
        return db_channel
      }
    }
    if (!youtube) {
      youtube = createYouTubeClientWithKey()
    }
    const yt_channelData = await getChannelByHandle(youtube, handle)
    if (yt_channelData) {
      const yt_newChannelData = yt_channelData
      if (db_channel) {
        return Channel.saveFromYoutube(yt_newChannelData, db_channel)
      } else {
        return Channel.saveFromYoutube(yt_newChannelData)
      }
    } else {
      console.warn(`Channel ${handle} not found on YouTube`)
      return null
    }
  }

  /**
   * @deprecated This function is not implemented yet and will not behave as expected.
   * Please implement the required logic or avoid using this function for now.
   */
  static async getChannelByMine(Id:string, youtube?:youtube_v3.Youtube):Promise<Channel|null> {
    const db_channel = await Channel.findByPk(Id)
    if (db_channel){
      if (db_channel.lastCheckedAt > new Date(Date.now() - db_channel.recheckInterval * 1000)) {
        return db_channel
      }
    }
    if (!youtube) {
      youtube = createYouTubeClientWithKey()
    }
    const yt_channelData = await getChannelsById(youtube, [Id])
    if (yt_channelData.length > 0) {
      const yt_newChannelData = yt_channelData[0]
      if (db_channel) {
        return Channel.saveFromYoutube(yt_newChannelData, db_channel)
      } else {
        return Channel.saveFromYoutube(yt_newChannelData)
      }
    } else {
      console.warn(`Channel ${Id} not found on YouTube`)
      return null
    }
  }

  

}

Channel.init({
  Id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey:true
  },
  Name: {
    type: DataTypes.STRING,
  },
  handle: {
    type: DataTypes.STRING,
  },
  Description: {
    type: DataTypes.STRING,
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
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  uploadsPlaylistId: {
    type: DataTypes.STRING,
  },
  videoCount: {
    type: DataTypes.INTEGER,
  },
  lastCheckedAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  recheckInterval: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 86400,
  },

  profilePictureUrl: {
    type: DataTypes.STRING,
  },
  profilePictureHash: {
    type: DataTypes.STRING,
  },
}, {
  sequelize,
  modelName: 'Channel',
  timestamps: true,
});


export { Channel};
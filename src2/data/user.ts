

import { DataTypes, Model } from 'sequelize';
import sequelize from './sequalise';
// import { snapshotYtUser, YtUser } from './YtUser';

import { google } from 'googleapis';

class User extends Model {
  public id!: number;
  public googleId!: string;
  public name!: string;
  public email!: string;
  public token!:Credentials;
  public blob!:JSON;
  
  public updateTokens(credentials: Credentials) {
    this.token = credentials
    this.save().catch(err=>console.error('Token save failed', err));
  }
  public static async getUser(id:number){
    return User.findOne({where:{googleId:id}})
  }
  
}

User.init({
  googleId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
  },
  token:{
    type:DataTypes.JSON
  },
}, {
  sequelize,
  modelName: 'User',
});

// import { GaxiosResponse } from 'gaxios';
import { oauth2_v2 } from 'googleapis';
import { Credentials } from 'google-auth-library';
// import {createYouTubeClient} from '../services/google/youTube/youtube';
// import TokenManager from '../services/google/token';
async function findOrCreateFromGoogle(googleData:oauth2_v2.Schema$Userinfo, tokens: Credentials):Promise<User | null>
{
  const existing = await User.findOne({where:{googleId: googleData.id}})
  if(existing){
    existing.updateTokens(tokens);
    return existing
  }
  
  // const youTube = createYouTubeClient(await new TokenManager(tokens).getClient())
  // const channelResponse = await youTube.channels.list({
  //   part: ['snippet', 'statistics'],
  //   mine: true,
  // });
  // const youtubeChannels = channelResponse.data.items
  // for (const youtubeChannel of youtubeChannels??[]){

  // }

  return await User.create({
    googleId: googleData.id,
    name: googleData.name,
    email: googleData.email,
    token:tokens,
    blob:googleData,
  });
}



export { User, findOrCreateFromGoogle };
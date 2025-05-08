import {YouTubeClient, createYouTubeClient} from "./youtube";
import { OAuth2Client } from 'google-auth-library';
import { youtube_v3 } from 'googleapis';
import { GaxiosResponse } from 'gaxios';
import { chunk } from "../../../utils/array";

const TEXTFORMAT:"plainText"|"html" = "html" 

type YouTubeAuth = OAuth2Client | youtube_v3.Youtube;

export async function getChannelsById(
    auth: YouTubeAuth, 
    channelIds: string[], 
    options={
        part:{
        auditDetails:false,
        brandingSettings:false,
        contentDetails:true,
        contentOwnerDetails:false,
        id:true,
        localizations:false,
        snippet:true,
        statistics:true,
        status:true,
        topicDetails:false,
        }
    }): Promise<youtube_v3.Schema$Channel[]> {


    const youTubeClient = auth instanceof OAuth2Client
        ? createYouTubeClient(auth)
        : auth;  
    const allChannels: youtube_v3.Schema$Channel[] = [];
    const blocks = chunk(channelIds, 50)
    const part = Object.entries(options.part)
        .filter(([_, value]) => value === true)
        .map(([key]) => key)
    for(const block of blocks){
        const response:GaxiosResponse<youtube_v3.Schema$ChannelListResponse> = await youTubeClient.channels.list({
            part:part,
            id:channelIds
        })
    
        if (response.data.items) allChannels.push(...response.data.items)
    }
    return allChannels
}

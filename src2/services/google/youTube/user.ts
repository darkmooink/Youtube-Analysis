import {YouTubeClient, createYouTubeClient} from "./youtube";
import { OAuth2Client } from 'google-auth-library';
import { youtube_v3 } from 'googleapis';
import { GaxiosResponse } from 'gaxios';
import { chunk } from "../../../utils/array";
type YouTubeAuth = OAuth2Client | youtube_v3.Youtube;


export async function getPublicDetailsOfUser(auth: YouTubeAuth, userID: string): Promise<youtube_v3.Schema$Channel> {
    return (await getPublicDetailsOfUsers(auth, [userID]))[0]
}
export async function getPublicDetailsOfUsers(auth: YouTubeAuth, userID: string[]): Promise<youtube_v3.Schema$Channel[]> {
    
    const youtube = auth instanceof OAuth2Client
    ? createYouTubeClient(auth)
    : auth;    
    const batches = chunk(userID,50)
    console.log(`getting ${userID.length} users in ${batches.length} chunks`)
    let data:youtube_v3.Schema$Channel[] = []
    for (const thisBatch of batches){
        try{
            const response = await youtube.channels.list({
                id: thisBatch,
                part: ['snippet', 'statistics', 'brandingSettings', 'contentDetails'],
            });

            if (!response.data.items || response.data.items.length === 0) {
                continue;
            }
            for (const channel of response.data.items){
                data.push(publicOnlyUserDetails(channel))
            }
            
        }catch (error) {
            console.error('Failed to fetch channel info:', error);
        }
    }
    console.log(`got ${data.length} channels`)
    return data;
}

function publicOnlyUserDetails (channel:youtube_v3.Schema$Channel
):youtube_v3.Schema$Channel
{
    if (channel.auditDetails){
        if (channel.statistics?.subscriberCount) delete channel.statistics.subscriberCount;
        if (channel.brandingSettings?.channel?.keywords)delete channel.brandingSettings?.channel?.keywords
        delete channel.contentDetails?.relatedPlaylists?.watchHistory
        delete channel.contentDetails?.relatedPlaylists?.watchLater
        delete channel.contentDetails?.relatedPlaylists?.favorites
        delete channel.contentDetails?.relatedPlaylists?.likes
        delete channel.auditDetails
        delete channel.contentOwnerDetails
    }
    
    return channel;
}
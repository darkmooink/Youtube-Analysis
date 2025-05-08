import {YouTubeClient, createYouTubeClient} from "./youtube";
import { OAuth2Client } from 'google-auth-library';
import { youtube_v3 } from 'googleapis';
import { GaxiosResponse } from 'gaxios';
import { chunk } from "../../../utils/array";
type YouTubeAuth = OAuth2Client | youtube_v3.Youtube;

export async function getVideosDetails(auth: YouTubeAuth, ids:string[]) {
    const youTubeClient = auth instanceof OAuth2Client
        ? createYouTubeClient(auth)
        : auth; 
    const batches = chunk(ids, 50)
    const videos: youtube_v3.Schema$Video[] = [];
    for (const batch of batches){
        const request: GaxiosResponse<youtube_v3.Schema$VideoListResponse> = await youTubeClient.videos.list({
            id:batch,
            part: ['snippet','statistics'],
            maxResults: 50,
        })
        request.data.items ? videos.push(...request.data.items):[]
    }
    return videos
}

export async function getVideoDetails(auth: YouTubeAuth, id:string) {
    const youTubeClient = auth instanceof OAuth2Client
    ? createYouTubeClient(auth)
    : auth; 
    return youTubeClient.videos.list({
        id:[id],
        part: ['snippet','statistics'],
    })
    
}
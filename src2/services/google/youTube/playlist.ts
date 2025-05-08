import {YouTubeClient, createYouTubeClient} from "./youtube";
import { OAuth2Client } from 'google-auth-library';
import { youtube_v3 } from 'googleapis';
import { GaxiosResponse } from 'gaxios';
import { chunk } from "../../../utils/array";
type YouTubeAuth = OAuth2Client | youtube_v3.Youtube;

export async function getPlaylistsDetails(auth:YouTubeAuth,playlistIds:string[], removeDeadVids=true):Promise<youtube_v3.Schema$Playlist[]> {
    const youTubeClient = auth instanceof OAuth2Client
        ? createYouTubeClient(auth)
        : auth; 
    const batches = chunk(playlistIds, 50);
    let playlists:youtube_v3.Schema$Playlist[] = []
    for(const batch of batches){
        const response: GaxiosResponse<youtube_v3.Schema$PlaylistListResponse> = await youTubeClient.playlists.list({
            part: ['snippet', 'contentDetails', 'status'],
            id: batch,
            maxResults: 50
        });
        if (response.data.items) playlists.push(...response.data.items);
    }
    return playlists

}

export async function getVideosFromPlaylist(auth:YouTubeAuth,playlistId:string, removeDeadVids=true):Promise<{videoId:string, snippet:youtube_v3.Schema$PlaylistItemSnippet}[]> {
    const youTubeClient = auth instanceof OAuth2Client
        ? createYouTubeClient(auth)
        : auth; 
    let nextPageToken:undefined|null|string = null
    let videos = []
    do{
        const response:GaxiosResponse<youtube_v3.Schema$PlaylistItemListResponse> = await youTubeClient.playlistItems.list({
            part: ['snippet', 'contentDetails', 'status'],
            playlistId: playlistId,
            maxResults: 50,
            pageToken: nextPageToken ?? undefined,
          });
        nextPageToken=response.data.nextPageToken

        const items = response.data.items ?? [];

        for (const item of items) {
            const snippet = item.snippet;
            const videoId = item.contentDetails?.videoId;
            if (!snippet || !videoId) continue;
            if (removeDeadVids && (snippet.title === 'Private video' || snippet.title === 'Deleted video')) continue;

            videos.push({videoId:videoId,snippet:snippet});
        }

        nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);

    return videos;
}
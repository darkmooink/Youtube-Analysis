import {YouTubeClient, createYouTubeClient} from "./youtube";
import { OAuth2Client } from 'google-auth-library';
import { youtube_v3 } from 'googleapis';
import { GaxiosResponse } from 'gaxios';
import { chunk } from "../../../utils/array";
import { youtube } from "googleapis/build/src/apis/youtube";

async function getPlaylistItems(
    youTube: youtube_v3.Youtube,
    id: string,
    pageToken?: string
): Promise<GaxiosResponse<youtube_v3.Schema$PlaylistItemListResponse>> {
    return youTube.playlistItems.list({
        part: ['snippet'],
        maxResults: 50,
        playlistId: id,
        pageToken: pageToken,
    });
}

export async function getAllPlaylistItems(youTube: youtube_v3.Youtube, id: string) {
    let items: youtube_v3.Schema$PlaylistItem[] = [];
    let pageToken: string | undefined = undefined;
    do {
        const playlistItems: GaxiosResponse<youtube_v3.Schema$PlaylistItemListResponse> = await getPlaylistItems(youTube, id, pageToken);
        if (playlistItems) {
            items.push(...(playlistItems.data.items || [])); // Safely handle undefined `items`
            pageToken = playlistItems.data.nextPageToken || undefined;
        } else {
            pageToken = undefined;
        }
    } while (pageToken);
    return items;
}
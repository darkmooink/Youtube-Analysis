import { Channel } from "../data/channel";
import { Op, fn, col, literal } from "sequelize";
import { Comment } from "../data/comments";
import { Playlist } from "../data/playlist"
import { Video } from "../data/video";
import { getPublicDetailsOfUsers } from "../services/google/youTube/user"
import { createYouTubeClientWithKey } from "../services/google/youTube/youtube"
import { getVideosFromPlaylist } from "../services/google/youTube/playlist";
import { youtube, youtube_v3 } from "googleapis/build/src/apis/youtube";
import { getVideosDetails } from "../services/google/youTube/video";
const auth = createYouTubeClientWithKey();

export async function summery(){
    const newChannels = await Comment.count({
        where: {
            '$Channel.youtubeChannelId$': null
        },
        include: [{
            model: Channel,
            required: false
        }],
        distinct: true,
        col: 'author',
    });
    console.log(`there are ${newChannels} channels not been looked at`)
}

export async function getUserDetails(size=50) {
    const newChannels = await Comment.findAll({
        where: {
            '$Channel.youtubeChannelId$': null,
        },
        include: [{
            model: Channel,
            required: false
        }],
        attributes: ['author'],
        group: ['author'],
        limit:size,
    });

    const authors: string[] = newChannels.map(c => c.author).filter(Boolean);
    
    const channelsDetails = await getPublicDetailsOfUsers(auth, authors);

    const returnedIds = new Set(channelsDetails.map(c => c.id));
    const missingIds = authors.filter(id => !returnedIds.has(id));

    const newChannelRecords = [
        ...channelsDetails.map(channel => ({
            youtubeChannelId: channel.id!,
            channelName: channel.snippet?.title ?? '',
            channelDescription: channel.snippet?.description ?? '',
            lastCheckedAt: new Date(),
            subscriberCount: parseInt(channel.statistics?.subscriberCount ?? '0', 10),
            archivedData: [channel],
            created: new Date(channel.snippet?.publishedAt ?? new Date()),
            etag: channel.etag ?? '',
            lastActivityAt: new Date(),
            status: 1,
        }))
        ,
        ...missingIds.map(id => ({
            youtubeChannelId: id,
            channelName: '',
            channelDescription: '',
            lastCheckedAt: new Date(),
            subscriberCount: 0,
            archivedData: [],
            created: new Date(),
            etag: '',
            lastActivityAt: new Date(),
            status: 0,
        }))
    ];
    
    Channel.bulkCreate(newChannelRecords, {
        ignoreDuplicates: true,
    });
    console.log(`got ${newChannelRecords.length} new channels with ${channelsDetails.length} valid and ${missingIds.length} missing`)

    
}
let gotPlaylistsFromChannels = false
export async function getNewVideos(playlistonly = false) {
    if (!gotPlaylistsFromChannels){
        extractPlaylistsFromUsers().catch()
        gotPlaylistsFromChannels = true
    }
    if (playlistonly) return null
    const playlist = await Playlist.findOne({
        where:{
            lastChecked:null,
            size:{[Op.gt]:0},
        },
        order:[['size', 'asc']]
    })
    if (!playlist) return null
    const videos = await getVideosFromPlaylist(auth, playlist?.youtubeId)

    let newVideos: Partial<Video>[] = []
    for(const video of videos){
        if (!video.snippet || !video.videoId) continue
       const newVideo = {
            youtubeId: video.videoId,
            channelId:video.snippet.channelId??undefined,
            title: video.snippet.title ?? undefined,
            description: video.snippet.description ?? undefined,
            publishedAt: video.snippet.publishedAt ? new Date(video.snippet.publishedAt):undefined,
            lastChecked: new Date(),
       } 
       if (
        !newVideo.channelId ||
        !newVideo.publishedAt ||
        !newVideo.title
       ) {console.log(newVideo);continue}
       newVideos.push(newVideo)
    }
    Video.bulkCreate(newVideos)
    console.log(`added ${newVideos.length}/${videos.length} new videos to the db`)
    if(newVideos.length > (videos.length)){
        for (const video of newVideos){
            console.log(video.youtubeId)
        }
        console.log(videos)
    }
    playlist.lastChecked = new Date()
    playlist.save()
}

async function extractPlaylistsFromUsers(){
    // await Playlist.destroy({ where: {}, truncate: true });
    const BATCH_SIZE = 100;
    const channels = await Channel.findAll()
    let newPlaylsits: Partial<Playlist>[] = []
    console.log(`getting  playlists for ${channels.length} channels`)
    for (const channel of channels) {
        try {
            const relatedPlaylists = (channel.archive?.[0]?.contentDetails?.relatedPlaylists) as Record<string, string> | undefined;
            if (!relatedPlaylists) continue;

            for (const type in relatedPlaylists) {
                const youtubeId = relatedPlaylists[type];
                if (!youtubeId) continue;
                const playlist:Partial<Playlist> = {
                    youtubeId:youtubeId,
                    type:type,
                    authorId: channel.youtubeChannelId,
                }
                if(type=="uploads" && channel.archive![0].statistics?.videoCount){
                    playlist.size = parseInt(channel.archive![0].statistics?.videoCount)
                }
                newPlaylsits.push(playlist);
            }

            if (newPlaylsits.length >= BATCH_SIZE) {
                await Playlist.bulkCreate(newPlaylsits, { ignoreDuplicates: true });
                newPlaylsits = [];
            }
        } catch (err) {
            console.error(`Failed to process channel ${channel.youtubeChannelId}:`, err);
        }
    }
}

export async function getVideoDetails() {
    const videos = await Video.findAll({
        where: {
            archive: { [Op.not]: [] }
        },
        limit:50
    });

    if (videos.length < 50) return null;
    const videoIds = []
    for (const video of videos){
        videoIds.push(video.youtubeId)
    }
    const allVideoDetails = await getVideosDetails(auth, videoIds);
    for (const video of allVideoDetails) {
        const record = await Video.findOne({ where: { youtubeId: video.id } });
        if (record) {
            record.lastChecked = new Date()
            record.archive = [video];
            await record.save(); 
        }
    }


}

export async function needMoreData():Promise<boolean> {

    return false
}

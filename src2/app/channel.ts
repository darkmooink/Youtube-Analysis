import { google } from 'googleapis';
import { Request, Response } from 'express';
import { Comment, commentToDB as commentToDB, fromVideo} from '../data/comments'
import { Channel } from '../data/channel';
import { resolveAll } from '../utils/async';
import { Playlist } from '../data/playlist';
import { Video } from '../data/video';
type ChannelDetails = {
  channel: (Channel|null)  & {commentCount?:number, commenterCount?:number},
  uploads:{playlist:any, videos:Video[]}, comments:Comment[]
};
type ChannelDetailsPromises = {
  [K in keyof ChannelDetails]: Promise<ChannelDetails[K]>;
};
export async function showChannelDetails(req: Request, res: Response) {
  const channelID = req.params.id;


  try {
    const youtube = req.youTubeClient!;
    const options = {youtube:youtube}
    const channelResult = await Channel.getChannelById(channelID, options);
    if (!channelResult) {
      console.error(`Channel not found for ID ${channelID}`);
      res.status(404).send(`Channel not found for ID ${channelID}`);
      return;
    }
    let channel: Channel & { commentCount?: number; commenterCount?: number } = channelResult;
    channel.commentCount = 0;
    channel.commenterCount = 0;
    const uploadsPlaylist = await Playlist.getByChannelId(channelID, { ...options, query: { where: { type: "upload" } } });
    // console.log(uploadsPlaylist)
    if (!uploadsPlaylist || uploadsPlaylist.length === 0) {
      console.error(`No uploads playlist found for channel ${channelID}`);
      res.status(404).send(`No uploads playlist found for ${channelID}`);
      return;
    }
    if (uploadsPlaylist.length > 1) {
      console.warn(`Multiple uploads playlists found for channel ${channelID}`);
    }
    let getVideos:boolean =false, getComments:boolean = false, getChannels:boolean = false
    if (req.query.updateVideo){
      getVideos = (req.query.updateVideo == 'true')
    }
    const videos = await Video.getByChannelId(channelID, {
      ...options,  get: getVideos, archive: true,})
    
      
    const comments = []
    if (req.query.updateComment){
      getComments = (req.query.updateComment == 'true')
    }
    for (const video of videos) {
      if (video.archive && video.archive.length > 0 && video.archive[0].statistics?.commentCount) {
        channel.commentCount! += parseInt(video.archive[0].statistics?.commentCount);
      }
      comments.push(...await Comment.fromVideo(video.youtubeId, getComments?youtube:undefined));
    }


    const channelDetails: ChannelDetails = {
      channel: channel,
      uploads: { playlist: uploadsPlaylist[0],
        videos: videos,
      },
      comments: comments,
    };
    console.log(channelDetails)
    // const channelDetails = await resolveAll(channelDetailsPromices)
    res.render('channel', { channelID, channelDetails});
  } catch (error) {
    console.error('Failed to fetch something for channel:', error);
    res.status(500).send(`Error fetching something for ${channelID}`);
  }
}
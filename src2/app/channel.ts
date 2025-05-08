import { google } from 'googleapis';
import { Request, Response } from 'express';
import { Comment, commentToDB as commentToDB, fromVideo} from '../data/comments'
import { Channel } from '../data/channel';
import { resolveAll } from '../utils/async';
import { Playlist } from '../data/playlist';
import { Video } from '../data/video';
type ChannelDetails = {
  channel: Channel|null;
  uploads:{playlist:any, videos:Video[]}
};
type ChannelDetailsPromises = {
  [K in keyof ChannelDetails]: Promise<ChannelDetails[K]>;
};
export async function showChannelDetails(req: Request, res: Response) {
  const channelID = req.params.id;


  try {
    const youtube = req.youTubeClient!;
    const options = {youtube:youtube}
    const channel = await Channel.getChannelById(channelID, options)
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
    let get:boolean = false
    if (req.query.updateVideo){
      get = (req.query.updateVideo == 'true')
    }
    const videos = await Video.getByChannelId(channelID, {
      ...options,  get: get, archive: false,})
    
      
    const channelDetails: ChannelDetails = {
      channel: channel,
      uploads: { playlist: uploadsPlaylist[0],
        videos: videos
      },
    };
    console.log(channelDetails)
    // const channelDetails = await resolveAll(channelDetailsPromices)
    res.render('channel', { channelID, channelDetails});
  } catch (error) {
    console.error('Failed to fetch something for channel:', error);
    res.status(500).send(`Error fetching something for ${channelID}`);
  }
}
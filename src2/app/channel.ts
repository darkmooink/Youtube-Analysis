import { Request, Response } from 'express';
import { Channel } from '../data/channel';
import { createYouTubeClientWithKey } from '../services/google/youTube/youtube';

export async function showChannelDetails(req: Request, res: Response) {
  const channelID = req.params.id;
  if (req.youTubeClient) req.youTubeClient = createYouTubeClientWithKey();
  try {
    let channel: Channel | null;
    if (!req.youTubeClient) {
      channel = await Channel.getChannelByMine("", req.youTubeClient);
    } else if (req.params.id.startsWith('@')) {
      channel = await Channel.getChannelByHandle(channelID, req.youTubeClient);
    } else {
      channel = await Channel.getChannelById(channelID, req.youTubeClient);
    }

    if (!channel) {
      res.status(404).send(`Channel not found for ${req.params.id}`);
      return;
    }

    const similarProfileCount = await channel.howManyOtherChannelsHaveThisProfilePicture();
    res.render('channel2', { channel, similarProfileCount });
  } catch (error) {
    console.error('Error fetching channel details:', error);
    res.status(500).send('Internal server error');
  }
}

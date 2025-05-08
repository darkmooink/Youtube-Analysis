import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import { User } from '../data/user';
import '../express-session/express-session';
import { requireLoginAndGoogleSession } from '../express-session/requireLogin'; 


const router = Router();

router.get('/', requireLoginAndGoogleSession, async (req: Request, res: Response) => {
  const oauth2Client = req.googleSession

  try {
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // Get channel info (for name)
    const channelResponse = await youtube.channels.list({
      part: ['snippet', 'statistics'],
      mine: true,
    });


    const channel = channelResponse.data.items?.[0];
    const name = channel?.snippet?.title || 'user';

    // Get videos
    const videosResponse = await youtube.search.list({
      part: ['id'],
      forMine: true,
      type: ['video'],
      maxResults: 50,
    });

    const videoCount = videosResponse.data.items?.length || 0;

    // Get comments
    const commentThreadsResponse = await youtube.commentThreads.list({
      part: ['snippet'],
      allThreadsRelatedToChannelId: channel?.id || '',
      maxResults: 100,
    });

    const commentCount = commentThreadsResponse.data.items?.length || 0;

    res.send(`
      <html>
        <head><title>Welcome</title></head>
        <body>
          <h1>Welcome ${name}</h1>
          ${videoCount} videos with ${commentCount} comments
          ${videosResponse.data.items?.pop()?.id?.videoId}
          <a href="app/video/b3TOVBNSJDA">comments</a>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Failed to fetch YouTube data:', error);
    res.status(500).send(`Error fetching YouTube data.${error}`);
  }
});

import {showVideoComments} from "../app/video"
router.get('/video/:id',requireLoginAndGoogleSession, showVideoComments);
import {showChannelDetails} from "../app/channel"
router.get('/channel/:id',requireLoginAndGoogleSession, showChannelDetails);

// import categoriserRouter from '../app/categoriser';
// router.use('/', categoriserRouter);

export default router
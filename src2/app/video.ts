import { Request, Response } from 'express';
import { createYouTubeClientWithKey } from '../services/google/youTube/youtube';
import { Video } from '../data/video';

export async function showVideoDetails(req: Request, res: Response) {
    const youtube = req.youTubeClient? req.youTubeClient : createYouTubeClientWithKey();
  try {
    const videoId = req.params.id;
    const video = await Video.getFromId(videoId, youtube);
    
    res.render('video2', { video });
  } catch (error) {
    console.error('Error fetching playlist details:', error);
    res.status(500).send('Internal server error');
  }
}

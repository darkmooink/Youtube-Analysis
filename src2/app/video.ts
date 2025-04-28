import { google } from 'googleapis';
import { Request, Response } from 'express';
import { Comment, commentToDB as commentToDB, fromVideo} from '../data/comments'

export async function showVideoComments(req: Request, res: Response) {
  const videoId = req.params.id;

  try {
    const youtube = req.youTubeClient!;
    const comments = await fromVideo(req.googleSession!,videoId)
    
    res.render('video', { videoId, comments });
  } catch (error) {
    console.error('Failed to fetch video comments:', error);
    res.status(500).send(`Error fetching comments for video ${videoId}`);
  }
}
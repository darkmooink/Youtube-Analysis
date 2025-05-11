import { Request, Response } from 'express';
import { createYouTubeClientWithKey } from '../services/google/youTube/youtube';
import { Comment } from '../data/comment';

export async function showVideoComments(req: Request, res: Response) {
  const videoId = req.params.id;
  if (req.youTubeClient) req.youTubeClient = createYouTubeClientWithKey();
  try {
    let comments: Comment[] = await Comment.fromVideo(videoId, req.youTubeClient);

    if (!comments) {
      res.status(404).send(`comments not found for ${req.params.id}`);
      return;
    }

    
    res.render('comments2', { comments });
  } catch (error) {
    console.error('Error fetching comment details:', error);
    res.status(500).send('Internal server error');
  }
}

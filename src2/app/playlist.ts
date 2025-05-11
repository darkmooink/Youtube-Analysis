import { Request, Response } from 'express';
import { createYouTubeClientWithKey } from '../services/google/youTube/youtube';
import { Playlist } from '../data/playlist';

export async function showPlaylistDetails(req: Request, res: Response) {
  const playlistId = req.params.id;
  if (req.youTubeClient) req.youTubeClient = createYouTubeClientWithKey();
  try {
    let playlist: Playlist | null = await Playlist.getFromId(playlistId, req.youTubeClient);

    if (!playlist) {
      res.status(404).send(`playlist not found for ${req.params.id}`);
      return;
    }

    
    res.render('playlist', { playlist });
  } catch (error) {
    console.error('Error fetching playlist details:', error);
    res.status(500).send('Internal server error');
  }
}

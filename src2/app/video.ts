import { google } from 'googleapis';
import { Request, Response } from 'express';
import { Comment, commentToDB as commentToDB } from '../data/comments'

export async function showVideoComments(req: Request, res: Response) {
  if (!req.session?.tokens) {
    return res.redirect('/login');
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(req.session.tokens);
  const videoId = req.params.id;

  try {
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    let allThreads = [];
    let nextPageToken: string | undefined = undefined;

    do {
      const commentsResponse: any = await youtube.commentThreads.list({
        part: ['snippet', 'replies'],
        videoId,
        maxResults: 100,
        pageToken: nextPageToken,
      });

      allThreads.push(...(commentsResponse.data.items || []));
      nextPageToken = commentsResponse.data.nextPageToken;
    } while (nextPageToken);

    const comments = allThreads.map(thread => {
        const top = thread.snippet?.topLevelComment;
        commentToDB(top, videoId)

        return {
            id: top?.id,
            author: top?.snippet?.authorDisplayName,
            text: top?.snippet?.textDisplay,
            publishedAt: top?.snippet?.publishedAt,
            replies: thread.replies?.comments?.map((reply: any) => {
                commentToDB(reply, videoId)
                return {
                    id: reply.id,
                    author: reply.snippet?.authorDisplayName,
                    text: reply.snippet?.textDisplay,
                    publishedAt: reply.snippet?.publishedAt,
                }
            }) || [] 
        };
    });

    res.render('video', { videoId, comments });
  } catch (error) {
    console.error('Failed to fetch video comments:', error);
    res.status(500).send(`Error fetching comments for video ${videoId}`);
  }
}
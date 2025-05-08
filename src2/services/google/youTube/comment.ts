import {YouTubeClient, createYouTubeClient} from "./youtube";
import { OAuth2Client } from 'google-auth-library';
import { youtube_v3 } from 'googleapis';
import { GaxiosResponse } from 'gaxios';

const TEXTFORMAT:"plainText"|"html" = "html" 

type YouTubeAuth = OAuth2Client | youtube_v3.Youtube;

export async function getAllCommentsForVideo(auth: YouTubeAuth, videoId: string, options={forceAll:true}): Promise<youtube_v3.Schema$Comment[]> {
  const youTubeClient = auth instanceof OAuth2Client
    ? createYouTubeClient(auth)
    : auth;  
  const allThreads: youtube_v3.Schema$CommentThread[] = [];
  let nextPageToken: string | undefined = undefined;

  do {
    const response: GaxiosResponse<youtube_v3.Schema$CommentThreadListResponse> = await youTubeClient.commentThreads.list({
      part: ['snippet', 'replies'],
      videoId: videoId,
      maxResults: 100, // Max allowed
      pageToken: nextPageToken,
      textFormat: TEXTFORMAT,
    });

    if (response.data.items) {
      allThreads.push(...response.data.items);
    }

    nextPageToken = response.data.nextPageToken ?? undefined;
    if (allThreads.length>1000 && !(options.forceAll))nextPageToken =  undefined
  } while (nextPageToken);

  const replies: youtube_v3.Schema$Comment[] = [];
  const topComments: youtube_v3.Schema$Comment[] = [];

  for (const thread of allThreads) {
    if (thread.snippet?.topLevelComment) {
      topComments.push(thread.snippet.topLevelComment);

      const repliesAlreadyFetched = thread.replies?.comments ?? [];
      
      if (thread.snippet.totalReplyCount && repliesAlreadyFetched.length === thread.snippet.totalReplyCount) {
        // Replies are complete
        replies.push(...repliesAlreadyFetched);
      } else if (thread.snippet.totalReplyCount && repliesAlreadyFetched.length < thread.snippet.totalReplyCount && (options.forceAll)) {
        // Need to fetch missing replies
        const extraReplies = await getRestOfReplies(thread.snippet.topLevelComment, youTubeClient);
        replies.push(...repliesAlreadyFetched, ...extraReplies);
      }
    }
  }
  console.log(`${topComments.length} comments were got with ${replies.length} replies`)
  return [...topComments, ...replies];
}

async function getRestOfReplies(comment: youtube_v3.Schema$Comment, youTubeClient: youtube_v3.Youtube): Promise<youtube_v3.Schema$Comment[]> {
  const allReplies: youtube_v3.Schema$Comment[] = [];
  let nextPageToken: string | undefined = undefined;

  do {
    const response = await youTubeClient.comments.list({
        part: ['snippet'],
        parentId: comment.id!,
        maxResults: 100,
        pageToken: nextPageToken,
        textFormat: TEXTFORMAT,
      }) as GaxiosResponse<youtube_v3.Schema$CommentListResponse>;
      
      const data = response.data;

    if (data.items) {
      allReplies.push(...data.items);
    }

    nextPageToken = data.nextPageToken ?? undefined;
  } while (nextPageToken);

  return allReplies;
}

export default getAllCommentsForVideo
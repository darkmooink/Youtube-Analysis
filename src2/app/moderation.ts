import { google } from 'googleapis';
import { Request, Response } from 'express';
import { Comment, commentToDB as commentToDB, fromVideo} from '../data/comments'

export async function moderateVideoComments(req: Request, res: Response) {
    const videoId = req.params.id || req.body.videoId;
  if(videoId){
    if(req.body.commentID){
        //todo:save the moderation 
    }
  }

}
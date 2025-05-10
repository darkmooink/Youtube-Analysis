import { Request, Response, NextFunction } from 'express';
import { google } from 'googleapis';
import {createYouTubeClient} from "../services/google/youTube/youtube"
import { User } from '../data/user';
import TokenManager from '../services/google/token';
import { GoogleSession } from '../services/google/session';

export function requireLogin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    console.log("requireLogin: no user session, redirecting to /login");
    req.session.redirectTo = req.originalUrl; // Store the original URL
    return res.redirect('/login');
  }
  next();
}

export async function withGoogleSession(req: Request, res: Response, next: NextFunction) {
  let token:TokenManager|null = null
  let user : User|null = null
  if (req.session && req.session.userId){
    user = await User.getUser(req.session.userId)
    if (user) token = new TokenManager(user?.token)
  }
  if(!token && req.session.tokens){
    token = new TokenManager(req.session.tokens)
  }
  if (!token) {
    console.log("withGoogleSession: No tokens in session, redirecting to login");
    return res.redirect('/login');
  }
  const oauth2Client = await token.getClient()
  req.googleSession = oauth2Client;
  req.youTubeClient =createYouTubeClient(oauth2Client)
  next();
}

// Combined version for routes that need both login and ready-to-use Google API
export function requireLoginAndGoogleSession(req: Request, res: Response, next: NextFunction) {
  requireLogin(req, res, () => {
    withGoogleSession(req, res, next);
  });
}
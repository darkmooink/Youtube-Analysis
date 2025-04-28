import { Request, Response, NextFunction } from 'express';
import { google } from 'googleapis';
import createYouTubeClient from "../services/google/youTube/youtube"

export function requireLogin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    console.log("requireLogin: no user session, redirecting to /login");
    return res.redirect('/login');
  }
  next();
}

export function withGoogleSession(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.tokens) {
    console.log("withGoogleSession: No tokens in session, redirecting to login");
    return res.redirect('/login');
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(req.session.tokens);
  console.log("test"+req.session.tokens)
  req.googleSession = oauth2Client;
  req.youTubeClient = createYouTubeClient(oauth2Client)
  next();
}

// Combined version for routes that need both login and ready-to-use Google API
export function requireLoginAndGoogleSession(req: Request, res: Response, next: NextFunction) {
  requireLogin(req, res, () => {
    withGoogleSession(req, res, next);
  });
}
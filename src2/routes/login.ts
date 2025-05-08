import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import { findOrCreateFromGoogle } from '../data/user';
import {TokenManager} from '../services/google/token'

import {createYouTubeClient} from '../services/google/youTube/youtube';

const router = Router();

const oauth2Client = new google.auth.OAuth2({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: 'http://localhost:3000/login/callback',
});

const scopes = [
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'profile',
  'email',
];

router.get('/', (req: Request, res: Response) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    // prompt: 'consent'
  });
  res.redirect(url);
});

router.get('/consent', (req: Request, res: Response) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
  res.redirect(url);
});

router.get('/callback', async (req: Request, res: Response) => {
  const { code } = req.query;

  const { tokens } = await oauth2Client.getToken(code as string);
  const manager = new TokenManager(tokens, oauth2Client);

  req.session.tokens = tokens; // ✅ store raw token data only

  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();

  const user = await findOrCreateFromGoogle(userInfo.data, tokens)
  req.session.userId = user?.id
  


  console.log('User info:', userInfo.data);
  res.redirect('/app');
});


// router.get('/logout', (req: Request, res: Response) => {
//     req.session = null;
//     res.redirect('/');
//   });

export default router;
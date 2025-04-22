import { Router, Request, Response } from 'express';
import { google } from 'googleapis';

const router = Router();

const oauth2Client = new google.auth.OAuth2({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: 'http://localhost:3000/login/callback',
});

const scopes = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'profile',
  'email',
];

router.get('/', (req: Request, res: Response) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  res.redirect(url);
});

router.get('/callback', async (req: Request, res: Response) => {
  const { code } = req.query;

  const { tokens } = await oauth2Client.getToken(code as string);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();

  // Store tokens + user info in session, DB, or redirect with token
  console.log('User info:', userInfo.data);

  res.send(`Hello ${userInfo.data.name}`);
});

// router.get('/logout', (req: Request, res: Response) => {
//     req.session = null;
//     res.redirect('/');
//   });

export default router;
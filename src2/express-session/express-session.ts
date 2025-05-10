// src2/types/express-session.d.ts

import 'express-session';
import type { Credentials, OAuth2Client } from 'google-auth-library';
import { youtube_v3 } from 'googleapis';

declare module 'express-session' {
  interface SessionData {
    tokens?: Credentials,
    userId?: number
    redirectTo?: string;
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    googleSession?: OAuth2Client;
    youTubeClient?: youtube_v3.Youtube
  }
}
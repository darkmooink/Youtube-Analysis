// src2/types/express-session.d.ts

import 'express-session';
import type { Credentials } from 'google-auth-library'; 

declare module 'express-session' {
  interface SessionData {
    tokens?: Credentials
  }
}
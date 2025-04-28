import { google } from 'googleapis';
import { Request } from 'express';

export class GoogleSession {
  static fromRequest(req: Request) {
    if (!req.session?.tokens) {
      throw new Error('Not authenticated');
    }
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials(req.session.tokens);
    return oauth2Client;
  }
}
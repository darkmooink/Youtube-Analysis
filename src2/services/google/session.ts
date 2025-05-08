import { google } from 'googleapis';
import { Request } from 'express';
import { OAuth2Client, Credentials } from 'google-auth-library';

export class GoogleSession {
  static fromRequest(req: Request) {
    if (!req.session?.tokens) {
      throw new Error('Not authenticated');
    }
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials(req.session.tokens);
    return oauth2Client;
  }
  static fromCredentials(credentials:Credentials){
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials(credentials);
    return oauth2Client;
  }
}
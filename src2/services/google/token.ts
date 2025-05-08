import { OAuth2Client, Credentials } from 'google-auth-library';
import { GoogleSession } from './session';
import { User } from '../../data/user';

export class TokenManager {
  private tokens: Credentials;
  private client: OAuth2Client;

  constructor(tokens: Credentials, client?: OAuth2Client) {
    this.tokens = tokens;
    if (client){
    this.client = client;
    }else{
      this.client = GoogleSession.fromCredentials(tokens)
    }
    this.client.setCredentials(tokens);
  }

  async getFromUser(userID:number){
    let user = await User.getUser(userID)
    if (user && user.token){
      return new TokenManager(user?.token)
    }else{
      return null
    }
  }

  async ensureValidAccessToken(): Promise<string> {
    if (!this.tokens.access_token || this.isExpired()) {
      await this.refreshToken();
    }
    return this.tokens.access_token!;
  }

  private isExpired(): boolean {
    return !!this.tokens.expiry_date && Date.now() > this.tokens.expiry_date;
  }

  private async refreshToken() {
    const refreshed = await this.client.refreshAccessToken();
    this.tokens = refreshed.credentials;
    this.client.setCredentials(this.tokens);
    // TODO: persist updated tokens to session or DB
  }

  async getCredentials(): Promise<Credentials> {
    await this.ensureValidAccessToken();
    return this.tokens;
  }
  async getClient(){
    await this.ensureValidAccessToken();
    return this.client
  }
}
export default TokenManager
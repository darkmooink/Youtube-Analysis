import { OAuth2Client, Credentials } from 'google-auth-library';

export class TokenManager {
  private tokens: Credentials;
  private client: OAuth2Client;

  constructor(tokens: Credentials, client: OAuth2Client) {
    this.tokens = tokens;
    this.client = client;
    this.client.setCredentials(tokens);
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
}
export default TokenManager
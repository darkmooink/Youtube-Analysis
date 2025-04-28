import { google, youtube_v3 } from "googleapis";
import { OAuth2Client } from 'google-auth-library';

function createYouTubeClient(oauth2:OAuth2Client):youtube_v3.Youtube{
    return google.youtube({ version: 'v3', auth: oauth2 });
}
export default createYouTubeClient

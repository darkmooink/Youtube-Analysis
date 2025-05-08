import { OAuth2Client } from "google-auth-library/build/src/auth/oauth2client";
import { youtube_v3 } from "googleapis/build/src/apis/youtube/v3";

export type depth = "channel" | "playlist" | "video" | "comment" | "reply";
export type options = {youtube?:youtube_v3.Youtube, auth?:OAuth2Client}
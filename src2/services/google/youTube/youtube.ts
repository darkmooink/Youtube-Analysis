import { google, youtube_v3 } from "googleapis";
import { OAuth2Client } from 'google-auth-library';

function createYouTubeClient(oauth2:OAuth2Client):youtube_v3.Youtube{
    return google.youtube({ version: 'v3', auth: oauth2 });
}
export default createYouTubeClient

export class YouTubeClient {
  private static bootTime = new Date()
  private static newCounts:Record<string, {used:number, perDay:number, startAllowance:number}> = {user:{used:0, perDay:1000, startAllowance:100}, background:{used:0, perDay:1000, startAllowance:0}}
  private static counts:Record<string, {used:number, perDay:number, startAllowance:number}> = this.newCounts
  public static costs: Record<string, number> = {
      "activities.list": 1,
      "captions.list": 50,
      "captions.insert": 400,
      "captions.update": 450,
      "captions.delete": 50,
      "channelBanners.insert": 50,
      "channels.list": 1,
      "channels.update": 50,
      "channelSections.list": 1,
      "channelSections.insert": 50,
      "channelSections.update": 50,
      "channelSections.delete": 50,
      "comments.list": 1,
      "comments.insert": 50,
      "comments.update": 50,
      "comments.setModerationStatus": 50,
      "comments.delete": 50,
      "commentThreads.list": 1,
      "commentThreads.insert": 50,
      "commentThreads.update": 50,
      "guideCategories.list": 1,
      "i18nLanguages.list": 1,
      "i18nRegions.list": 1,
      "members.list": 1,
      "membershipsLevels.list": 1,
      "playlistItems.list": 1,
      "playlistItems.insert": 50,
      "playlistItems.update": 50,
      "playlistItems.delete": 50,
      "playlists.list": 1,
      "playlists.insert": 50,
      "playlists.update": 50,
      "playlists.delete": 50,
      "search.list": 100,
      "subscriptions.list": 1,
      "subscriptions.insert": 50,
      "subscriptions.delete": 50,
      "thumbnails.set": 50,
      "videoAbuseReportReasons.list": 1,
      "videoCategories.list": 1,
      "videos.list": 1,
      "videos.insert": 1600,
      "videos.update": 50,
      "videos.rate": 50,
      "videos.getRating": 1,
      "videos.reportAbuse": 50,
      "videos.delete": 50,
      "watermarks.set": 50,
      "watermarks.unset": 50
    }

  static create(oauth2: OAuth2Client, bucket:string): youtube_v3.Youtube {
    if (!this.counts[bucket]){
      throw new Error(`Quota bucket "${bucket}" is not defined.`);
    }
    const yt = createYouTubeClient(oauth2);

    function wrap(target: any, path: string[] = []): any {
      return new Proxy(target, {
        get(obj, prop, receiver) {
          const val = obj[prop];
          if (typeof val === 'function' && prop === 'list') {
            return function (...args: any[]) {
              const method = [...path, String(prop)].join('.');
              
              const now = new Date();
              const hoursSinceBoot = (now.getTime() - YouTubeClient.bootTime.getTime()) / 1000 / 60 / 60;
              while (hoursSinceBoot > 24){
                YouTubeClient.counts = YouTubeClient.newCounts
                hoursSinceBoot-24
                YouTubeClient.bootTime = now
              }
              const fractionOfDayElapsed = Math.min(hoursSinceBoot / 24, 1);

              const bucketInfo = YouTubeClient.counts[bucket];
              const allowedSoFar = bucketInfo.startAllowance + (bucketInfo.perDay * fractionOfDayElapsed);
              if (!YouTubeClient.costs[method]){
                throw new Error(`Quota method "${method}" is not recognised. Please add it to the costs table.`);
              }
              const cost = YouTubeClient.costs[method];

              if (bucketInfo.used + cost > allowedSoFar) {
                console.warn(`[Quota] ${bucket} bucket would exceed allowed quota: ${bucketInfo.used + cost}/${allowedSoFar}`);
                if (bucket == "background"){
                  throw Error("quoter used up")
                }
              } else {
                console.log(`[Quota] ${bucket} bucket allowed quota: ${bucketInfo.used + cost}/${allowedSoFar}`);
                bucketInfo.used += cost;
              }

              return val.apply(obj, args);
            };
          }

          if (typeof val === 'object' && val !== null) {
            return wrap(val, [...path, String(prop)]);
          }

          return val;
        },
      });
    }

    return wrap(yt) as youtube_v3.Youtube;
  }
}
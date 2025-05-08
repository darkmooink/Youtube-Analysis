import { DataTypes, Model } from 'sequelize';
import sequelize from './sequalise';
import { options } from '../types';
import { Playlist } from './playlist';
import { createYouTubeClientFromOptions } from '../services/google/youTube/youtube';
import { getAllPlaylistItems } from '../services/google/youTube/playlistItems';
import { getVideosDetails } from '../services/google/youTube/video';
export class Video extends Model {
    public youtubeId!: string;
    public channelId!: string;
    public title!: string;
    public description!: string;
    public publishedAt?: Date;
    public lastChecked?: Date;
    public archive?: object;
    public static async getByChannelId(channelId: string, options?: options & {get:boolean, archive:boolean}): Promise<Video[]> {
        if (options && options.get && (options.auth || options.youtube)) {
            const uploadsPlaylist = await Playlist.getByChannelId(channelId, options);
            options = createYouTubeClientFromOptions(options);
            const youTubeClient = options!.youtube;

            const existingVideos = await Video.findAll({
                attributes: ['youtubeId'],
                where: { channelId: channelId },
            });
            const existingVideoIds = new Set(existingVideos.map(video => video.youtubeId));

            const videos = await getAllPlaylistItems(youTubeClient!, uploadsPlaylist[0].youtubeId);
            const newVideos:Partial<Video>[] = [];

            for (const video of videos) {
                if (video.snippet?.resourceId?.kind === 'youtube#video') {
                    const videoId = video.snippet.resourceId.videoId!;
                    if (!existingVideoIds.has(videoId)) {
                      
                        newVideos.push({
                            youtubeId: videoId,
                            channelId: channelId,
                            title: video.snippet?.title!,
                            description: video.snippet?.description!,
                            publishedAt: new Date(video.snippet?.publishedAt!),
                            lastChecked: new Date()
                        });
                    }
                }
            }
            if (options!.archive && newVideos.length > 0) {
              const newVideoIds = newVideos.map(video => video.youtubeId) as string[];
              const videoDetails = await getVideosDetails(youTubeClient!, newVideoIds);
              for (const video of videoDetails) {
                const videoId = video.id!;
                const videoData = newVideos.find(v => v.youtubeId === videoId);
                if (videoData) {
                  videoData.archive = video;
                }
              }
            }

            if (newVideos.length > 0) {
                await Video.bulkCreate(newVideos, { ignoreDuplicates: true });
            }
        }
        const videos = await Video.findAll({
            where: {
                channelId: channelId,
            },
        });
        if (videos.length > 0) return videos;
        return [];
    }
  }
  Video.init({
    youtubeId: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    channelId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastChecked: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    archive: {
      type: DataTypes.JSONB,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'Video',
    timestamps: false,
  });

require('dotenv').config()


export const CONFIG = {
    test:process.env.TEST,
    youtube_api_key:process.env.YOUTUBE_API_KEY
} as const

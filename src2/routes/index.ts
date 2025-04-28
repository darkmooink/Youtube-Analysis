import { Router, Request, Response } from 'express';

const router = Router();
router.get('/', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>YouTube Comment Moderation</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; }
            a.button {
              display: inline-block;
              padding: 10px 20px;
              font-size: 16px;
              background-color: #4285f4;
              color: white;
              text-decoration: none;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <h1>Welcome home</h1>
          <a href="/login" class="button">Login with Google</a>
        </body>
      </html>
    `);
  });

  export default router
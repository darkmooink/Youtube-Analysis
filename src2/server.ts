import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mainRouter from './router';

const app = express();

app.use('/', mainRouter);

const PORT = process.env.EX_PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 


// import express from 'express';
// import { Categorisation } from '../data/categorisations';
// import { Categories } from '../data/categories';
// import { Comment } from '../data/comments';

// const router = express.Router();
// const videoTitleCache = new Map<string, string>();

// async function getNextComment(videoId?: string) {
//   const whereClause: any = {};

//   if (videoId) {
//     whereClause.videoId = videoId;
//   }

//   const comment = await Comment.findOne({
//     where: whereClause,
//     // order: [['publishedAt', 'ASC']],
//     include: [{
//       model: Categorisation,
//       required: false,
//       where: { id: null },
//     }],
//   });

//   return comment;
// }

// router.get('/categoriser/:videoId?', async (req, res) => {
//   const { videoId } = req.params;

//   const comment = await getNextComment(videoId);

//   if (!comment) {
//     return res.send('No more comments to categorise!');
//   }

//   const categories = await Categories.findAll();
//   let videoTitle = videoTitleCache.get(comment.videoId);

//   if (!videoTitle) {
//     const video = await Video.findOne({ where: { youtubeId: comment.videoId } });
//     videoTitle = video?.title || 'Unknown Video';
//     videoTitleCache.set(comment.videoId, videoTitle);
//   }

//   const totalComments = await Comment.count({
//     where: videoId ? { videoId } : {},
//   });

//   const currentIndex = await Categorisation.count({
//     where: videoId ? { videoId } : {},
//   }) + 1;

//   res.render('categoriser', {
//     comment,
//     categories,
//     currentIndex,
//     totalComments,
//     videoTitle,
//     videoId,
//   });
// });

// router.post('/categoriser/submit', async (req, res) => {
//   const { commentId, categories, videoId } = req.body;
//   const userId = req.session.userId;

//   for (const catName of categories) {
//     const category = await Categories.findOne({ where: { name: catName } });
//     if (category) {
//       await Categorisation.create({
//         commentId,
//         categoryId: category.id,
//         userId,
//       });
//     }
//   }

//   if (videoId) {
//     res.redirect(`/categoriser/${videoId}`);
//   } else {
//     res.redirect('/categoriser');
//   }
// });

// export default router;
import express from 'express';
import { generateBlogContent, suggestTags, summarizePost } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/generate', protect, generateBlogContent);
router.post('/suggest-tags', protect, suggestTags);
router.post('/summarize', summarizePost);

export default router;

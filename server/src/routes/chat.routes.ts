import { Router } from 'express';
import { chatController } from '../controllers/chat.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Conversations
router.get('/conversations', chatController.getConversations);
router.get('/conversations/:id', chatController.getConversation);
router.post('/conversations', chatController.createConversation);
router.delete('/conversations/:id', chatController.deleteConversation);
router.patch('/conversations/:id/title', chatController.updateTitle);

// Messages
router.post('/conversations/:id/messages', chatController.sendMessage);

export default router;


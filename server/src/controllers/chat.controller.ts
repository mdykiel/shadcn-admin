import { Request, Response } from 'express';
import { z } from 'zod';
import { chatService } from '../services/chat.service.js';

const createConversationSchema = z.object({
  title: z.string().optional(),
  unitId: z.string().uuid().optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Treść wiadomości jest wymagana'),
});

const updateTitleSchema = z.object({
  title: z.string().min(1, 'Tytuł jest wymagany'),
});

export const chatController = {
  // GET /chat/conversations
  async getConversations(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const unitId = req.query.unitId as string | undefined;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const conversations = await chatService.getConversations(userId, unitId);
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  },

  // GET /chat/conversations/:id
  async getConversation(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const conversation = await chatService.getConversation(id, userId);

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      res.json(conversation);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({ error: 'Failed to fetch conversation' });
    }
  },

  // POST /chat/conversations
  async createConversation(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const data = createConversationSchema.parse(req.body);
      const title = data.title || 'Nowa rozmowa';

      const conversation = await chatService.createConversation(userId, title, data.unitId);
      res.status(201).json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error creating conversation:', error);
      res.status(500).json({ error: 'Failed to create conversation' });
    }
  },

  // DELETE /chat/conversations/:id
  async deleteConversation(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await chatService.deleteConversation(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      res.status(500).json({ error: 'Failed to delete conversation' });
    }
  },

  // PATCH /chat/conversations/:id/title
  async updateTitle(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const data = updateTitleSchema.parse(req.body);
      const conversation = await chatService.updateConversationTitle(id, userId, data.title);
      res.json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error updating title:', error);
      res.status(500).json({ error: 'Failed to update title' });
    }
  },

  // POST /chat/conversations/:id/messages
  async sendMessage(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const data = sendMessageSchema.parse(req.body);
      const result = await chatService.sendMessage(id, userId, data.content);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  },
};


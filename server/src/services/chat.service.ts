import OpenAI from 'openai';
import prisma from '../utils/prisma.js';

// Lazy initialization - OpenAI client is created only when needed
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set. Please add it to your .env file.');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

const SYSTEM_PROMPT = `Jesteś Budzeto - inteligentnym asystentem księgowym specjalizującym się w księgowości jednostek budżetowych w Polsce.

Twoje kompetencje:
1. Znajomość Rozporządzenia Ministra Finansów w sprawie szczególnych zasad rachunkowości jednostek budżetowych
2. Pomoc w dekretowaniu operacji gospodarczych
3. Wyjaśnianie zasad prowadzenia ksiąg rachunkowych
4. Doradzanie w zakresie planu kont
5. Pomoc z klasyfikacją budżetową (działy, rozdziały, paragrafy)
6. Wyjaśnianie sprawozdawczości budżetowej (Rb-27S, Rb-28S, etc.)

Zasady:
- Odpowiadaj po polsku
- Bądź precyzyjny i profesjonalny
- Podawaj konkretne numery kont i paragrafy gdy to możliwe
- Jeśli nie jesteś pewien, powiedz o tym wprost
- Możesz pytać o szczegóły jeśli są potrzebne do udzielenia dokładnej odpowiedzi`;

export const chatService = {
  // Pobierz wszystkie rozmowy użytkownika
  async getConversations(userId: string, unitId?: string) {
    return prisma.conversation.findMany({
      where: {
        userId,
        ...(unitId && { unitId }),
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  },

  // Pobierz konkretną rozmowę z wiadomościami
  async getConversation(conversationId: string, userId: string) {
    return prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  },

  // Stwórz nową rozmowę
  async createConversation(userId: string, title: string, unitId?: string) {
    return prisma.conversation.create({
      data: {
        userId,
        title,
        unitId,
      },
    });
  },

  // Usuń rozmowę
  async deleteConversation(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    return prisma.conversation.delete({
      where: { id: conversationId },
    });
  },

  // Zmień tytuł rozmowy
  async updateConversationTitle(conversationId: string, userId: string, title: string) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    return prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });
  },

  // Wyślij wiadomość i pobierz odpowiedź AI
  async sendMessage(conversationId: string, userId: string, content: string) {
    // Sprawdź czy rozmowa istnieje i należy do użytkownika
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Zapisz wiadomość użytkownika
    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'USER',
        content,
      },
    });

    // Przygotuj historię dla OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversation.messages.map((msg) => ({
        role: msg.role === 'USER' ? 'user' as const : 'assistant' as const,
        content: msg.content,
      })),
      { role: 'user', content },
    ];

    // Wywołaj OpenAI API
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Przepraszam, nie mogę teraz odpowiedzieć.';

    // Zapisz odpowiedź AI
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: aiResponse,
      },
    });

    // Zaktualizuj datę rozmowy
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return {
      userMessage,
      assistantMessage,
    };
  },
};


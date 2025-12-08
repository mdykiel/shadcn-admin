import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error-handler.js';
import prisma from '../utils/prisma.js';

export interface JwtPayload {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Brak tokenu autoryzacji', 401);
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new AppError('Błąd konfiguracji serwera', 500);
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      throw new AppError('Użytkownik nie istnieje', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Nieprawidłowy token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token wygasł', 401));
    } else {
      next(error);
    }
  }
};

// Check if user has access to a specific unit
export const authorizeUnit = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const unitId = req.params.unitId || req.body.unitId;

    if (!unitId) {
      throw new AppError('Brak identyfikatora jednostki', 400);
    }

    if (!req.user) {
      throw new AppError('Wymagana autoryzacja', 401);
    }

    const userUnit = await prisma.userUnit.findUnique({
      where: {
        userId_unitId: {
          userId: req.user.id,
          unitId: unitId,
        },
      },
    });

    if (!userUnit) {
      throw new AppError('Brak dostępu do tej jednostki', 403);
    }

    // Add user's role for this unit to request
    (req as any).userUnit = userUnit;
    next();
  } catch (error) {
    next(error);
  }
};


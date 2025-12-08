import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import { AppError } from '../middleware/error-handler.js';
import type { RegisterInput, LoginInput } from '../validators/auth.validator.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const authService = {
  async register(data: RegisterInput) {
    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('Użytkownik z tym adresem email już istnieje', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate token
    const token = this.generateToken(user.id, user.email);

    return { user, token, units: [] };
  },

  async login(data: LoginInput) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        unitMemberships: {
          include: {
            unit: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Nieprawidłowe dane logowania', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      throw new AppError('Nieprawidłowe dane logowania', 401);
    }

    // Generate token
    const token = this.generateToken(user.id, user.email);

    // Format units with user role
    const units = user.unitMemberships.map((membership) => ({
      ...membership.unit,
      userRole: membership.role,
      isUserOwner: membership.isOwner,
    }));

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
      units,
    };
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        unitMemberships: {
          include: {
            unit: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Użytkownik nie istnieje', 404);
    }

    const units = user.unitMemberships.map((membership) => ({
      ...membership.unit,
      userRole: membership.role,
      isUserOwner: membership.isOwner,
    }));

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      units,
    };
  },

  generateToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  },
};


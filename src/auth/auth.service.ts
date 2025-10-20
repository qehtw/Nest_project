import { BadRequestException, Injectable, ResponseDecoratorOptions } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) { }

  private generateAccessToken(userId: string, role: string) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    return jwt.sign(
      { userId, role },
      secret,
      { expiresIn: '15m' }
    );
  }

  private generateRefreshToken(userId: string) {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not defined');
    }

    return jwt.sign(
      { userId },
      secret,
      { expiresIn: '7d' }
    );
  }

  async generateAndSaveTokens(userId: string, role: string) {
    const accessToken = this.generateAccessToken(userId, role);
    const refreshToken = this.generateRefreshToken(userId);
    await this.saveSession(userId, accessToken, refreshToken);

    return { accessToken };
  }

  async verifyAccessToken(accessToken: string): Promise<boolean> {
    try {
      const secret = process.env.JWT_SECRET;

      if (!secret) {
        throw new Error('JWT_SECRET is not defined');
      }

      jwt.verify(accessToken, secret);
      console.log('Decoded user from JWT:', jwt.decode(accessToken));

      return true;
    } catch (error) {

      return false;
    }
  }
  async verifyRefreshToken(refreshToken: string): Promise<boolean> {
    try {
      const secret = process.env.JWT_REFRESH_SECRET;

      if (!secret) {
        throw new Error('JWT_REFRESH_SECRET is not defined');
      }

      jwt.verify(refreshToken, secret);

      return true;
    } catch (error) {

      return false;
    }
  }

  async getSessionByAccessToken(accessToken: string): Promise<{ refreshToken: string; userId: string } | null> {
    const session = await this.prisma.session.findUnique({
      where: { accessToken },
    });

    return session || null;
  }

  async saveSession(userId: string, accessToken: string, refreshToken: string) {

    return this.prisma.session.create({
      data: {
        userId,
        accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
  }

  async deleteSessionByRefreshToken(refreshToken: string) {

    return this.prisma.session.deleteMany({
      where: { refreshToken },
    });
  }

  async getRefreshTokenByAccessToken(accessToken: string) {
    const session = await this.prisma.session.findUnique({
      where: { accessToken },
    });

    return session?.refreshToken || null;
  }

  async getUserIdFromToken(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      return (decoded as { userId: string }).userId;
    } catch {
      try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
        return (decoded as { userId: string }).userId;
      } catch {
        return null;
      }
    }
  }

  async register(email: string, password: string, role: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        firstName: '',
        lastName: '',
        email,
        password: hashedPassword,
        role,
      },
    });
    const accessToken = this.generateAccessToken(user.id, role);
    const refreshToken = this.generateRefreshToken(user.id);

    const storeTokens = await this.prisma.session.upsert({
      where: { userId: user.id },
      update: {
        accessToken: accessToken,
        refreshToken: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 3600000),
      },
      create: {
        userId: user.id,
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    return { id: user.id, email: user.email, accessToken: storeTokens.accessToken, role: user.role };
  }

  async login(email: string, password: string) {

    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new BadRequestException('Email or password is incorrect');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Email or password is incorrect');
    }

    const accessToken = this.generateAccessToken(user.id, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    const storeTokens = await this.prisma.session.upsert({
      where: { userId: user.id },
      update: {
        accessToken: accessToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 3600000),
      },
      create: {
        userId: user.id,
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    return { id: user.id, email: user.email, accessToken: storeTokens.accessToken };
  }
}

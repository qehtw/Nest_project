import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  private generateAccessToken(userId: string) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }
      
    return jwt.sign(
      { userId },
      secret,
      { expiresIn: '1h' }
    );
  }

  async register(email: string, password: string) {
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
            },
        });
        const accessToken = this.generateAccessToken(user.id);

        return { id: user.id, email: user.email, accessToken };
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

        const accessToken = this.generateAccessToken(user.id);

        return { id: user.id, email: user.email, accessToken };
    }
}

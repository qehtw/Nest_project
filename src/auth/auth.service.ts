import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) {}

    async register(email: string, password: string) {
        const existinguser = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existinguser) {
            throw new Error('User already exists');
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
        return {id: user.id, email: user.email};
    }
}

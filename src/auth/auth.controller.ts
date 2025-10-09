import { Controller, Get, Post, Body, Res, UseGuards,Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import type { Response } from 'express';
import { JwtAuthGuard } from './Guard/jwt.guard';


@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Get('status')
    getStatus() {
        return { status: 'ok' };
    }

    @Post('register')
    
    async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
        const result = await this.authService.register(dto.email, dto.password);
        response.cookie(`accessToken`, result.accessToken, {
            httpOnly: true,
            path: '/',
            maxAge: 360000,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });
        return result
    }

    @Post('login')
    async login(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) { 
        const result = await this.authService.login(dto.email, dto.password);
        response.cookie(`accessToken`, result.accessToken, {
            httpOnly: true,
            path: '/',
            maxAge: 360000,
            secure: false, //process.env.NODE_ENV === 'production'
            sameSite: 'lax',
        });

        return result
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Res({ passthrough: true }) response: Response) {
        return response.req['user'];

        
    }
}

//{
//  "email": "test1@example.com",
//  "password": "123456"
//}

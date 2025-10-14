import { Controller, Get, Post, Body, Res, UseGuards, Req, Redirect } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from './Guard/jwt.guard';
import { PrismaService } from '../../prisma/prisma.service';


@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private prisma: PrismaService) { }

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
      maxAge: 3600000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return result
  }

  @Post('login')
  @Redirect('/auth/profile', 302)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(dto.email, dto.password);
    response.cookie(`accessToken`, result.accessToken, {
      httpOnly: true,
      path: '/',
      maxAge: 3600000,
      secure: false, //process.env.NODE_ENV === 'production'
      sameSite: 'lax',
    });

    return result
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() request: Request) {
    const accessToken = request.cookies.accessToken;
    const userId = await this.authService.getUserIdFromToken(accessToken);
    console.log('userId:', userId);

    if (!userId) {
      throw new Error("No userId found")
    }

    return this.authService.getUserProfile(userId);
  }

  @Post('logout')
  @Redirect("/auth/login", 302)
  async logout(@Res() res: Response, @Req() request: Request) {
    res.clearCookie('accessToken', { path: '/', httpOnly: true, sameSite: 'lax' })
    const accessToken = request.cookies.accessToken;
    const refreshToken = await this.authService.getRefreshTokenByAccessToken(accessToken);
    if (!refreshToken) {
      throw new Error('No refresh token found for the provided access token');
    }
    await this.authService.deleteSessionByRefreshToken(refreshToken)
    return res.json({ message: 'Logged out successfully' });
  }

  @Post('refresh')
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const accessToken = request.cookies.accessToken;
    if (!accessToken) {
      throw new Error('No access token provided');
    }

    const refreshToken = await this.authService.getRefreshTokenByAccessToken(accessToken);
    if (!refreshToken) {
      throw new Error('No refresh token found for the provided access token');
    }

    await this.authService.deleteSessionByRefreshToken(refreshToken);

    const userId = await this.authService.getUserIdFromToken(refreshToken);
    if (!userId) {
      throw new Error('Invalid refresh token');
    }

    const token = await this.authService.generateAndSaveTokens(userId);
    response.cookie('accessToken', token.accessToken, {
      httpOnly: true,
      path: '/',
      maxAge: 3600000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return token;
  }

}

//{
//  "email": "test1@example.com",
//  "password": "123456"
//}

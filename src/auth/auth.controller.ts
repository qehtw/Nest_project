import { Controller, Get, Post, Body, Res, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Response, Request } from 'express';


@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Get('status')
  getStatus() {

    return { status: 'ok' };
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response, @Req() request: Request) {
    const result = await this.authService.register(dto.email, dto.password, dto.role);

    const origin = request.headers.origin || '*';
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Access-Control-Allow-Origin', origin);

    response.cookie(`accessToken`, result.accessToken, {
      httpOnly: true,
      path: '/',
      maxAge: 3600000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    return result
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response, @Req() request: Request) {
    const result = await this.authService.login(dto.email, dto.password);

    const origin = request.headers.origin || '*';
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Access-Control-Allow-Origin', origin);

    response.cookie(`accessToken`, result.accessToken, {
      httpOnly: true,
      path: '/',
      maxAge: 3600000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    return result
  }

  @Get('login')
  getLogin() {
    return { message: 'Use POST /auth/login with credentials (this endpoint exists to prevent 404 on GET)' };
  }

  @Post('logout')
  async logout(@Res() res: Response, @Req() request: any) {
    res.clearCookie('accessToken', { path: '/', httpOnly: true, sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', secure: process.env.NODE_ENV === 'production' });
    const accessToken = request.cookies?.accessToken;
    if (!accessToken) {
      return res.json({ message: 'Logged out (no access token found)' });
    }
    const refreshToken = await this.authService.getRefreshTokenByAccessToken(accessToken);
    if (!refreshToken) {
      return res.json({ message: 'Logged out (no refresh token found)' });
    }
    await this.authService.deleteSessionByRefreshToken(refreshToken);
    return res.json({ message: 'Logged out successfully' });
  }

  // @Post('refresh')
  // async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
  //   const accessToken = request.cookies.accessToken;
  //   const role = request.cookies.role
  //   if (!accessToken) {
  //     throw new Error('No access token provided');
  //   }

  //   if (!role) {
  //     throw new Error('No role provided')
  //   }

  //   const refreshToken = await this.authService.getRefreshTokenByAccessToken(accessToken);
  //   if (!refreshToken) {
  //     throw new Error('No refresh token found for the provided access token');
  //   }

  //   await this.authService.deleteSessionByRefreshToken(refreshToken);

  //   const userId = await this.authService.getUserIdFromToken(refreshToken);
  //   if (!userId) {
  //     throw new Error('Invalid refresh token');
  //   }

  //   const token = await this.authService.generateAndSaveTokens(userId, role);
  //   response.cookie('accessToken', token.accessToken, {
  //     httpOnly: true,
  //     path: '/',
  //     maxAge: 3600000,
  //     secure: process.env.NODE_ENV === 'production',
  //     sameSite: 'lax',
  //   });

  //   return token;
  // }

}

//{
//  "email": "test1@example.com",
//  "password": "123456"
//  "role": "Admin || FruitGuy || VegetableGuy "
//}

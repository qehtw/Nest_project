import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request, Response as ExpressResponse } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthService } from '../auth/auth.service';

interface RequestWithUser extends Request {
  user?: { userId: string, role?: string };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse<ExpressResponse>();

    // accept token from cookie OR Authorization header
    const headerAuth = (request.headers['authorization'] || request.headers['Authorization']) as string | undefined;
    const bearerToken = headerAuth && typeof headerAuth === 'string' && headerAuth.startsWith('Bearer ')
      ? headerAuth.slice(7)
      : undefined;
    const accesstoken = request.cookies?.accessToken || bearerToken;

    if (!accesstoken) {
      throw new UnauthorizedException('No access token provided');
    }

    const isAccessValid = await this.authService.verifyAccessToken(accesstoken);

    const userInfo = jwt.decode(accesstoken as string) as { userId: string, role?: string } | null;

    if (!userInfo || !userInfo?.userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    if (isAccessValid) {
      request.user = { userId: userInfo.userId, role: userInfo.role };
      return true;
    }

    // refresh flow
    const refreshToken = await this.authService.getRefreshTokenByAccessToken(accesstoken);
    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    const isRefreshValid = await this.authService.verifyRefreshToken(refreshToken);
    if (!isRefreshValid) {
      throw new UnauthorizedException('Refresh token invalid');
    }

    await this.authService.deleteSessionByRefreshToken(refreshToken);
    const tokens = await this.authService.generateAndSaveTokens(userInfo.userId, userInfo.role || '');

    // keep cookie attributes in sync with auth.controller
    response.cookie('accessToken', tokens.accessToken, {
      path: '/',
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 3600000,
      secure: process.env.NODE_ENV === 'production',
    });
    request.user = { userId: userInfo.userId, role: userInfo.role };
    return true;
  }
}

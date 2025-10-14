import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request, Response as ExpressResponse } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthService } from '../auth.service';

interface RequestWithUser extends Request {
  user?: { userId: string };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse<ExpressResponse>();

    const accesstoken = request.cookies.accessToken;
    console.log('JWT token from request:', accesstoken);

    if (!accesstoken) {
      throw new UnauthorizedException();
    }

    const isAccessValid = await this.authService.verifyAccessToken(accesstoken);

    if (isAccessValid) {
      const tokenId = jwt.decode(accesstoken as string) as { userId: string } | null;
      if (tokenId?.userId) {
        request.user = { userId: tokenId.userId };
        console.log('UserId from session:', tokenId.userId);

        return true;
      }
    }

    const session = await this.authService.getSessionByAccessToken(accesstoken);
    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    const refreshToken = session.refreshToken;
    const userId = await this.authService.getUserIdFromToken(refreshToken);
    if (!userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token')
    }

    const isRefreshValid = await this.authService.verifyRefreshToken(refreshToken);
    if (!isRefreshValid) {
      throw new UnauthorizedException('Token is not valid')
    }

    await this.authService.deleteSessionByRefreshToken(refreshToken);
    const tokens = await this.authService.generateAndSaveTokens(userId);

    response.cookie('accessToken', tokens.accessToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 3600000,
      secure: false
    });
    request.user = { userId };

    return true;
  }
}

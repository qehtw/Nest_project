import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const token = request.cookies?.accessToken;

    if (!token) {
      console.log('No token received from client');
      throw new UnauthorizedException('Token is missing');
    } else {
      console.log('Token from client:', token);
    }

    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) throw new Error('JWT_SECRET is not defined');
      const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
      request['user'] = payload;
      return true;
      
    } catch (err) {
      console.error('JWT verification failed:', (err as Error).message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

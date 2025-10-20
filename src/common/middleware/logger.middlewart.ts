import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP'); // тег у логах

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const start = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      this.logger.log(
        `${method} ${originalUrl} ${statusCode} - ${duration}ms - IP: ${clientIp}`,
      );
    });

    next();
  }
}

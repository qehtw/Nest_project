import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { GuardsModule } from '../guard/guard.module'
import { forwardRef } from '@nestjs/common';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy],
  imports: [forwardRef(() => GuardsModule)]
})
export class AuthModule { }

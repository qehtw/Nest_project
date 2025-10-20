import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { GuardsModule } from '../guard/guard.module';
import { AuthModule } from '../auth/auth.module'

@Module({
  providers: [UserService, PrismaService],
  controllers: [UserController],
  exports: [UserService],
  imports: [forwardRef(() => AuthModule), forwardRef(() => GuardsModule)]
})
export class UserModule { }


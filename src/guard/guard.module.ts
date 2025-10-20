import { Module, forwardRef } from '@nestjs/common';
import { JwtAuthGuard } from './jwt.guard';
import { AuthModule } from '../auth/auth.module';
import { RoleGuard } from './role.guard';
import { UserModule } from '../user/user.module';

@Module({
  providers: [JwtAuthGuard, RoleGuard],
  exports: [JwtAuthGuard, RoleGuard],
  imports: [forwardRef(() => AuthModule), forwardRef(() => UserModule)]
})
export class GuardsModule { }

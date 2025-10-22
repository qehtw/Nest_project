import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { Permission, PERMISSIONS_KEY, PERMISSIONS_MAPPING } from './permissions.enum';
import type { RequestWithUser } from './jwt.guard';

@Injectable()
export class RoleGuard implements CanActivate {
  private readonly logger = new Logger(RoleGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    const role = user?.role;

    const requiredPermissions: Permission[] =
      this.reflector.get<Permission[]>(PERMISSIONS_KEY, context.getHandler()) ||
      [];

    this.logger.debug(`RoleGuard: userRole=${role}, requiredPermissions=${JSON.stringify(requiredPermissions)}`);

    if (!role) {
      this.logger.warn('Role not found');
      throw new UnauthorizedException('Role not found');
    }

    const productClass = await this.resolveProductClass(request);
    this.logger.debug(`RoleGuard: Resolved productClass = ${productClass}`);

    if (!productClass && requiredPermissions.length > 0) {
      this.logger.warn('Product class not specified or could not be resolved');
      throw new BadRequestException('Product class not specified or could not be resolved');
    }

    if (role === 'Admin') {
      this.logger.debug('Admin shortcut, access granted');
      return true;
    }

    const allowed = productClass !== undefined ? PERMISSIONS_MAPPING[role]?.[productClass] : undefined;
    this.logger.debug(`RoleGuard: allowed permissions for role=${role}, productClass=${productClass}: ${JSON.stringify(allowed)}`);

    if (!allowed) {
      this.logger.warn(`Role "${role}" does not have any permissions for "${productClass}"`);
      throw new ForbiddenException(
        `Role "${role}" does not have any permissions for "${productClass}"`
      );
    }

    if (requiredPermissions.length === 0) {
      this.logger.debug('No specific permissions required, access granted');
      return true;
    }

    const hasAll = requiredPermissions.every((perm) => allowed.includes(perm));
    this.logger.debug(`RoleGuard: hasAllRequiredPermissions=${hasAll}`);
    if (hasAll) {
      this.logger.debug('All required permissions present, access granted');
      return true;
    }

    this.logger.warn(`Role "${role}" does not have required permissions (${requiredPermissions.join(',')}) for "${productClass}"`);
    throw new ForbiddenException(
      `Role "${role}" does not have required permissions (${requiredPermissions.join(
        ', '
      )}) for "${productClass}"`
    );
  }

  private async resolveProductClass(request: any): Promise<string | undefined> {

    const productId = request.body?.productId ?? request.body?.product ?? request.params?.productId ?? request.params?.id;
    const productName = request.body?.name ?? request.params?.name;

    if (productId !== undefined && productId !== null) {
      const product = await this.prisma.products.findUnique({ where: { id: productId } });
      if (product) return product.class;
    }
    if (productName) {
      const product = await this.prisma.products.findUnique({ where: { name: productName } });
      if (product) return product.class;
    }
    return undefined;
  }
}
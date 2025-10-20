import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { Request } from "express";
import { UserService } from "src/user/user.service";
import * as jwt from 'jsonwebtoken';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

interface RequestWithUser extends Request {
  user?: { userId: string, role: string }
}

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly userService: UserService, private readonly reflector: Reflector) { }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const headerAuth = (request.headers['authorization'] || request.headers['Authorization']) as string | undefined;
    const bearerToken = headerAuth && typeof headerAuth === 'string' && headerAuth.startsWith('Bearer ')
      ? headerAuth.slice(7)
      : undefined;
    const accesstoken = request.cookies?.accessToken || bearerToken;

    if (!accesstoken) {
      throw new UnauthorizedException('Authentication required');
    }

    const userInfo = jwt.decode(accesstoken as string) as { userId?: string, role?: string } | null;
    if (!userInfo || !userInfo.userId) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const userId = userInfo.userId;
    let role = userInfo.role;

    // if role missing, try DB; absence of role is an auth/permission problem -> 403
    if (!role) {
      const profile = await this.userService.getUserProfile(userId);
      role = profile?.role;
      if (!role) throw new ForbiddenException('User role not assigned');
    }

    // read allowed roles metadata
    const allowedRoles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler()) ||
      this.reflector.get<string[]>(ROLES_KEY, context.getClass());
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      // explicit forbidden for role mismatch
      throw new ForbiddenException(`Role "${role}" is not allowed for this action`);
    }

    // Accept product id first, fall back to name
    const productId = request.body?.productId || request.body?.product;
    const productName = request.body?.name;

    let productClass: string | undefined;
    if (productId) {
      productClass = await this.userService.getProductClassById(productId);
    } else if (productName) {
      productClass = await this.userService.getProductClass(productName);
    } else {
      // require product identifier only for domain-limited roles
      if (role === 'FruitGuy' || role === 'VegetableGuy') {
        throw new BadRequestException('Product identifier required for role-limited action');
      }
    }

    if (!productClass) {
      // product not found -> 400
      throw new BadRequestException('Product not found');
    }

    // role-domain check: return descriptive forbidden when mismatch
    const isAllowed = await this.userService.isRoleValid(userId, role, productClass);
    if (!isAllowed) {
      if (role === 'FruitGuy') {
        throw new ForbiddenException(`Access denied: role "FruitGuy" can only operate on "Fruits" products (product class: "${productClass}")`);
      }
      if (role === 'VegetableGuy') {
        throw new ForbiddenException(`Access denied: role "VegetableGuy" can only operate on "Vegetables" products (product class: "${productClass}")`);
      }
      // generic forbidden fallback
      throw new ForbiddenException('Access denied for this role');
    }

    // attach user info for downstream handlers/controllers
    request.user = { userId, role };
    return true;
  }
}
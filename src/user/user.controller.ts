import { Controller, Get, Post, Body, Delete, UseGuards, Req, BadRequestException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guard/jwt.guard';
import { RoleGuard } from '../guard/role.guard';
import { Permissions, Permission } from '../guard/permissions.enum';
import { UserService } from './user.service';
import type { RequestWithUser } from 'src/guard/jwt.guard';

@ApiTags('User')
@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private userService: UserService) { }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() request: RequestWithUser) {
    const userId = request.user?.userId;
    if (!userId) {
      throw new Error('No userId found');
    }
    return this.userService.getUserProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('basket')
  async getBasket(@Req() request: RequestWithUser) {
    const userId = request.user?.userId;
    if (!userId) throw new Error('No userId found');
    return this.userService.getBasketItems(userId);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Permissions(Permission.CREATE)
  @Post('basket/add')
  @ApiOperation({ summary: 'Add item to basket' })
  @ApiResponse({ status: 201, description: 'Item added to basket' })
  async addItemToBasket(@Req() request: RequestWithUser, @Body() body: any) {
    this.logger.debug(`addItemToBasket: user=${JSON.stringify(request.user)}, body=${JSON.stringify(body)}`);
    const userId = request.user?.userId;
    if (!userId) throw new BadRequestException('User not found in request');

    const productId = body?.productId || body?.product;
    const productName = body?.name;
    const quantity = body?.quantity;

    this.logger.debug(`addItemToBasket: productId=${productId}, productName=${productName}, quantity=${quantity}`);

    if (!productId && (!productName || typeof productName !== 'string' || productName.trim() === '')) {
      this.logger.warn('No product identifier provided');
      throw new BadRequestException('No product identifier provided');
    }
    if (quantity == null || Number.isNaN(Number(quantity)) || Number(quantity) <= 0) {
      this.logger.warn('Invalid quantity');
      throw new BadRequestException('Invalid quantity');
    }

    if (productId) return this.userService.sendItemById(userId, productId, Number(quantity));
    return this.userService.sendItem(userId, productName, Number(quantity));
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Permissions(Permission.DELETE)
  @Delete('basket/remove')
  @ApiOperation({ summary: 'Remove item from basket' })
  @ApiResponse({ status: 200, description: 'Item removed from basket' })
  async removeItemFromBasket(@Req() request: RequestWithUser, @Body() body: any) {
    this.logger.debug(`removeItemFromBasket: user=${JSON.stringify(request.user)}, body=${JSON.stringify(body)}`);
    const userId = request.user?.userId;
    if (!userId) throw new BadRequestException('User not found');

    const productId = body?.productId || body?.product;
    const productName = body?.name;

    this.logger.debug(`removeItemFromBasket: productId=${productId}, productName=${productName}`);

    if (!productId && (!productName || typeof productName !== 'string' || productName.trim() === '')) {
      this.logger.warn('No product identifier provided');
      throw new BadRequestException('No product identifier provided');
    }

    if (productId) return this.userService.deleteItemFromBasketById(productId, userId);
    return this.userService.deleteItemFromBasket(productName, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('basket/clear')
  @ApiOperation({ summary: 'Clear basket' })
  @ApiResponse({ status: 200, description: 'Basket cleared' })
  async clearBasket(@Req() request: RequestWithUser) {
    this.logger.debug(`clearBasket: user=${JSON.stringify(request.user)}`);
    const userId = request.user?.userId;
    if (!userId) throw new BadRequestException('User not found in request');
    return this.userService.clearBasket(userId);
  }
}

import { Controller, Get, Post, Body, Delete, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../guard/jwt.guard';
import { RoleGuard } from '../guard/role.guard';
import { Roles } from '../guard/roles.decorator';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) { }

  // 👤 Профіль користувача
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() request: any) {
    const userId = request.user.userId;
    if (!userId) throw new Error('No userId found');
    return this.userService.getUserProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('basket')
  async getBasket(@Req() request: any) {
    const userId = request.user.userId;
    if (!userId) throw new Error('No userId found');
    return this.userService.getBasketItems(userId);
  }

  // allow only authenticated + authorized users
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('Admin', 'FruitGuy', 'VegetableGuy')
  @Post('basket/add')
  async addItemToBasket(@Req() request: any, @Body() body: any) {
    const userId = request.user?.userId;
    if (!userId) throw new BadRequestException('User not found in request');

    const productId = body?.productId || body?.product;
    const productName = body?.name;
    const quantity = body?.quantity;

    if (!productId && (!productName || typeof productName !== 'string' || productName.trim() === '')) {
      throw new BadRequestException('No product identifier provided');
    }
    if (quantity == null || Number.isNaN(Number(quantity)) || Number(quantity) <= 0) {
      throw new BadRequestException('Invalid quantity');
    }

    if (productId) return this.userService.sendItemById(userId, productId, Number(quantity));
    return this.userService.sendItem(userId, productName, Number(quantity));
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('Admin', 'FruitGuy', 'VegetableGuy')
  @Delete('basket/remove')
  async removeItemFromBasket(@Req() request: any, @Body() body: any) {
    const userId = request.user?.userId;
    if (!userId) throw new BadRequestException('User not found');

    const productId = body?.productId || body?.product;
    const productName = body?.name;

    if (!productId && (!productName || typeof productName !== 'string' || productName.trim() === '')) {
      throw new BadRequestException('No product identifier provided');
    }

    if (productId) return this.userService.deleteItemFromBasketById(productId, userId);
    return this.userService.deleteItemFromBasket(productName, userId);
  }
  @UseGuards(JwtAuthGuard)
  @Post('basket/clear')
  async clearBasket(@Req() request: any) {
    const userId = request.user?.userId;
    if (!userId) throw new BadRequestException('User not found in request');
    return this.userService.clearBasket(userId);

  }
}

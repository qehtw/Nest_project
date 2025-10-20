import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';


@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) { }

  @Get('Items')
  async getAll() {
    return await this.productsService.getAll();
  }

  @Get('ClassItems')
  async getAllClassProducts(@Body('class') className: string) {
    return await this.productsService.getAllClassProducts(className)
  }

  @Get('ItemInfo')
  async getOne(@Param('name') name: string) {
    return await this.productsService.getItemInfo(name)
  }
}

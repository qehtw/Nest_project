import { Body, Controller, Get, Param, Post, UseGuards, Put, Delete, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from 'src/guard/jwt.guard';
import { RoleGuard } from 'src/guard/role.guard';
import { Permissions } from 'src/guard/permissions.enum';
import { Permission } from 'src/guard/permissions.enum';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) { }

  @Get('Items')
  async getAll() {
    return await this.productsService.getAll();
  }

  @Get('ClassItems/:class')
  async getAllClassProducts(@Param('class') className: string) {
    return await this.productsService.getAllClassProducts(className);
  }

  @Get('ItemInfo/:name')
  async getOne(@Param('name') name: string) {
    return this.productsService.getItemInfo(name);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Permissions(Permission.CREATE)
  @Post()
  @ApiOperation({ summary: 'Create a product' })
  @ApiResponse({ status: 201, description: 'Product created' })
  async createProduct(@Body() body: any) {
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const cls = body?.class;
    const priceRaw = body?.price;

    if (!name) throw new BadRequestException('Product name is required');
    if (cls !== 'Fruits' && cls !== 'Vegetables') throw new BadRequestException('Product class must be "Fruits" or "Vegetables"');
    if (priceRaw == null || Number.isNaN(Number(priceRaw))) throw new BadRequestException('Valid price is required');

    return this.productsService.createProduct({
      name,
      class: cls,
      price: Number(priceRaw),
      image: body.image,
      description: body.description,
    });
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Permissions(Permission.UPDATE)
  @Put(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  async updateProduct(@Param('id') id: string, @Body() body: any) {
    return this.productsService.updateProduct(id, {
      name: body.name,
      price: body.price != null ? Number(body.price) : undefined,
      image: body.image,
      description: body.description,
    });
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Permissions(Permission.DELETE)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  async deleteProduct(@Param('id') id: string) {
    return this.productsService.deleteProduct(id);
  }
}

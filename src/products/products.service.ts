import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ProductClass, Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) { }

  async getAll() {
    return this.prisma.products.findMany({
      select: {
        id: true,
        name: true,
        class: true,
        price: true,
        image: true,
        description: true,
      }
    });
  }

  async getAllClassProducts(className: string) {
    let classEnum: ProductClass;

    if (className === 'Fruits') classEnum = ProductClass.Fruits;
    else if (className === 'Vegetables') classEnum = ProductClass.Vegetables;
    else throw new Error('Invalid class name');

    return this.prisma.products.findMany({
      where: { class: classEnum },
      select: {
        id: true,
        name: true,
        class: true,
        price: true,
      },
    });
  }

  async getItemInfo(name: string) {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new BadRequestException('Product name is required');
    }

    const itemInfo = await this.prisma.products.findUnique({
      where: { name },
      select: {
        id: true,
        name: true,
        class: true,
        price: true,
        description: true,
      },
    });

    if (!itemInfo) throw new Error('No info found');

    return itemInfo;
  }

  async getById(id: string) {
    return this.prisma.products.findUnique({ where: { id } });
  }

  async createProduct(data: {
    name: string;
    class: 'Fruits' | 'Vegetables';
    price: number;
    image?: string;
    description?: string;
  }) {
    try {
      return await this.prisma.products.create({
        data: {
          name: data.name,
          class: data.class,
          price: data.price,
          image: data.image,
          description: data.description,
        }
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Product with this name already exists');
      }
      throw new BadRequestException('Failed to create product');
    }
  }

  async updateProduct(id: string, data: Partial<{
    name: string;
    class: 'Fruits' | 'Vegetables';
    price: number;
    image?: string;
    description?: string;
  }>) {
    try {
      return await this.prisma.products.update({
        where: { id },
        data: {
          ...data
        }
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Product not found');
      }
      throw new BadRequestException('Failed to update product');
    }
  }

  async deleteProduct(id: string) {
    try {
      const product = await this.prisma.products.findUnique({ where: { id } });
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      await this.prisma.$transaction([
        this.prisma.basketItem.deleteMany({ where: { productId: id } }),
        this.prisma.products.delete({ where: { id } }),
      ]);

      return { message: 'Product deleted' };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Product not found');
      }
      throw new BadRequestException('Failed to delete product');
    }
  }
}

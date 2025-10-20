import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ProductClass } from '@prisma/client';

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
}

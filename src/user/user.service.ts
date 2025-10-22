import { PrismaService } from 'prisma/prisma.service';
import { BadRequestException, Injectable, ResponseDecoratorOptions, NotFoundException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) { }

  async getUserIdFromToken(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      return (decoded as { userId: string }).userId;
    } catch {
      try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
        return (decoded as { userId: string }).userId;
      } catch {
        return null;
      }
    }
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  async getBasketItems(userId: string) {
    const basket = await this.prisma.basket.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!basket) {
      return [];
    }

    return basket.items.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      class: item.product.class,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.image,
      description: item.product.description,
    }));
  }

  async sendItem(userId: string, productName: string, quantity: number) {
    if (!productName) {
      throw new NotFoundException("No product name found")
    }

    const product = await this.prisma.products.findUnique({
      where: { name: productName },
    });

    if (!product) {
      throw new NotFoundException(`Product with name "${productName}" not found`);
    }

    let basket = await this.prisma.basket.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!basket) {
      basket = await this.prisma.basket.create({
        data: { userId },
        include: { items: true },
      });
    }

    const existingItem = basket.items.find(item => item.productId === product.id);

    if (existingItem) {
      return this.prisma.basketItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    }

    return this.prisma.basketItem.create({
      data: {
        basketId: basket.id,
        productId: product.id,
        quantity: quantity
      },
    });
  }

  async sendItemById(userId: string, productId: string, quantity: number) {
    if (!productId) {
      throw new NotFoundException("No product id found")
    }

    const product = await this.prisma.products.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with id "${productId}" not found`);
    }

    let basket = await this.prisma.basket.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!basket) {
      basket = await this.prisma.basket.create({
        data: { userId },
        include: { items: true },
      });
    }

    const existingItem = basket.items.find(item => item.productId === product.id);

    if (existingItem) {
      return this.prisma.basketItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    }

    return this.prisma.basketItem.create({
      data: {
        basketId: basket.id,
        productId: product.id,
        quantity: quantity
      },
    });
  }

  async isRoleValid(userId: string, role: string, productclass: string) {
    if (role === 'Admin') {
      return true
    }
    if (role === "FruitGuy" && productclass === "Fruits") {
      return true;
    }

    if (role === "VegetableGuy" && productclass === "Vegetables") {
      return true;
    }
    return false
  }

  async getProductClass(name: string) {
    const productInfo = await this.prisma.products.findUnique({
      where: { name }
    });
    return productInfo?.class
  }

  async getProductClassById(id: string) {
    const productInfo = await this.prisma.products.findUnique({
      where: { id }
    });
    return productInfo?.class;
  }

  async deleteItemFromBasket(productName: string, userId: string) {
    if (!productName) {
      throw new NotFoundException("No product name found")
    }

    const product = await this.prisma.products.findUnique({
      where: { name: productName },
    });

    if (!product) {
      throw new NotFoundException(`Product with name "${productName}" not found`);
    }

    let basket = await this.prisma.basket.findUnique({
      where: { userId },
      include: { items: true },
    });
    if (!basket) {
      basket = await this.prisma.basket.create({
        data: { userId },
        include: { items: true },
      });
    }

    const existingItem = basket.items.find(item => item.productId === product.id);

    if (existingItem) {
      return this.prisma.basketItem.delete({
        where: { id: existingItem.id }
      });

    } else {
      throw new Error('No item exist in basket')
    }

  }

  async deleteItemFromBasketById(productId: string, userId: string) {
    if (!productId) {
      throw new NotFoundException("No product id found")
    }

    const product = await this.prisma.products.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with id "${productId}" not found`);
    }

    let basket = await this.prisma.basket.findUnique({
      where: { userId },
      include: { items: true },
    });
    if (!basket) {
      basket = await this.prisma.basket.create({
        data: { userId },
        include: { items: true },
      });
    }

    const existingItem = basket.items.find(item => item.productId === product.id);

    if (existingItem) {
      return this.prisma.basketItem.delete({
        where: { id: existingItem.id }
      });
    } else {
      throw new Error('No item exist in basket')
    }
  }

  async clearBasket(userId: string) {
    const basket = await this.prisma.basket.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!basket) {
      return { message: 'Basket already empty' };
    }

    await this.prisma.basketItem.deleteMany({
      where: { basketId: basket.id },
    });

    return { message: 'Basket cleared' };
  }

}

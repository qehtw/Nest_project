import { IsEmail, IsNotEmpty, MinLength, MaxLength, Matches, IsEnum } from 'class-validator';

export enum Roles {
  Admin = 'Admin',
  FruitGuy = 'FruitGuy',
  VegetableGuy = 'VegetableGuy',
}

export class RegisterDto {

  @IsEmail({}, { message: 'Невірний формат email' })
  email: string;

  @IsNotEmpty({ message: 'Пароль не може бути порожнім' })
  @MinLength(8, { message: 'Пароль має містити щонайменше 8 символів' })
  @MaxLength(32, { message: 'Пароль не може перевищувати 32 символи' })
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).*$/, {
    message: 'Пароль має містити великі та малі літери і хоча б одну цифру',
  })
  password: string;

  @IsEnum(Roles, { message: 'Роль має бути однією з: Admin, FruitGuy або VegetableGuy' })
  role: Roles;
}

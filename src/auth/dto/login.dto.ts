import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Невірний формат email' })
  email: string;

  @IsNotEmpty({ message: 'Пароль не може бути порожнім' })
  password: string;
}

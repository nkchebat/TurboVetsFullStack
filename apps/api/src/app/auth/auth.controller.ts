import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '@turbovets/auth';
import { UsersService } from '../users/users.service';

class LoginDto {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
        (email: string) => this.usersService.findByEmail(email)
      );
      return this.authService.login(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}

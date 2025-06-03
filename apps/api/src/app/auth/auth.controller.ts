import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '@turbovets/auth';

class LoginDto {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password
      );
      return this.authService.login(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}

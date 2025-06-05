import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
      ignoreExpiration: false,
    });
  }

  async validate(payload: {
    sub: number;
    email: string;
    role: string;
    organizationId: number;
  }) {
    // Return the payload as the user object
    // The actual user lookup will be handled by a separate service if needed
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      organization: {
        id: payload.organizationId,
      },
    };
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenBlacklistService } from '../service/token-blacklist.service';

export interface JwtPayload {
  sub: string;
  email: string;
  jti: string;
}

export interface JwtValidatedUser {
  id: string;
  email: string;
  jti: string;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload & { exp?: number }): JwtValidatedUser {
    if (this.tokenBlacklistService.isRevoked(payload.jti)) {
      throw new UnauthorizedException('Token inválido o sesión cerrada');
    }

    return {
      id: payload.sub,
      email: payload.email,
      jti: payload.jti,
      exp: payload.exp,
    };
  }
}

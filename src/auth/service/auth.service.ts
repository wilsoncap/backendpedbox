import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { User } from '../entity/user.entity';
import { JwtValidatedUser } from '../strategy/jwt.strategy';
import { TokenBlacklistService } from './token-blacklist.service';
import { UsersService } from './users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  async register(dto: RegisterDto): Promise<User> {
    return this.usersService.create(dto);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload = { sub: user.id, email: user.email, jti: randomUUID() };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken, user };
  }

  logout(user: JwtValidatedUser): void {
    if (user.jti) {
      const ttlMs = user.exp ? user.exp * 1000 - Date.now() : 0;
      this.tokenBlacklistService.revoke(user.jti, ttlMs);
    }
  }
}

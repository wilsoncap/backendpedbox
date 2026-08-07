import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TokenBlacklistService } from '../service/token-blacklist.service';
import { JwtStrategy } from '../strategy/jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const configServiceMock = {
    getOrThrow: jest.fn().mockReturnValue('secret'),
  };

  const tokenBlacklistServiceMock = {
    isRevoked: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: configServiceMock },
        { provide: TokenBlacklistService, useValue: tokenBlacklistServiceMock },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('validate', () => {
    it('devuelve el usuario autenticado si el token no está revocado', () => {
      tokenBlacklistServiceMock.isRevoked.mockReturnValue(false);

      const result = strategy.validate({
        sub: 'uuid-1',
        email: 'a@b.com',
        jti: 'jti-1',
      });

      expect(result).toEqual({
        id: 'uuid-1',
        email: 'a@b.com',
        jti: 'jti-1',
      });
    });

    it('lanza UnauthorizedException si el token está revocado', () => {
      tokenBlacklistServiceMock.isRevoked.mockReturnValue(true);

      expect(() =>
        strategy.validate({
          sub: 'uuid-1',
          email: 'a@b.com',
          jti: 'jti-revocado',
        }),
      ).toThrow(UnauthorizedException);
    });
  });
});

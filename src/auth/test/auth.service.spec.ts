import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { TokenBlacklistService } from '../service/token-blacklist.service';
import { UsersService } from '../service/users.service';
import { AuthService } from '../service/auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  const user = {
    id: 'uuid-1',
    email: 'nuevo@example.com',
    password: 'hash',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const usersServiceMock = {
    create: jest.fn(),
    findByEmail: jest.fn(),
  };

  const jwtServiceMock = {
    signAsync: jest.fn(),
  };

  const tokenBlacklistServiceMock = {
    revoke: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: TokenBlacklistService, useValue: tokenBlacklistServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('delega la creación en UsersService y devuelve el usuario', async () => {
      usersServiceMock.create.mockResolvedValue(user);

      const result = await service.register({
        email: 'nuevo@example.com',
        password: 'secret123',
      });

      expect(usersServiceMock.create).toHaveBeenCalledWith({
        email: 'nuevo@example.com',
        password: 'secret123',
      });
      expect(result).toBe(user);
    });
  });

  describe('login', () => {
    it('devuelve accessToken y el usuario si las credenciales son correctas', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(user);
      jest.mocked(bcrypt.compare).mockResolvedValue(true);
      jwtServiceMock.signAsync.mockResolvedValue('token-123');

      const result = await service.login({
        email: 'nuevo@example.com',
        password: 'secret123',
      });

      expect(result.accessToken).toBe('token-123');
      expect(result.user).toBe(user);
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'uuid-1', email: 'nuevo@example.com' }),
      );
    });

    it('lanza UnauthorizedException si la contraseña es incorrecta', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(user);
      jest.mocked(bcrypt.compare).mockResolvedValue(false);

      await expect(
        service.login({ email: 'nuevo@example.com', password: 'incorrecta' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
    });

    it('lanza UnauthorizedException si el email no existe', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'noexiste@example.com', password: 'secret123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('revoca el jti del token en la blacklist', () => {
      service.logout({ id: 'uuid-1', email: 'a@b.com', jti: 'jti-1' });

      expect(tokenBlacklistServiceMock.revoke).toHaveBeenCalledWith(
        'jti-1',
        expect.any(Number),
      );
    });
  });
});

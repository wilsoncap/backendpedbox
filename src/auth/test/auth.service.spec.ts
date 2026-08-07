import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../service/users.service';
import { AuthService } from '../service/auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const usersServiceMock = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('delega la creación en UsersService y devuelve el usuario', async () => {
      const createdUser = {
        id: 'uuid-1',
        email: 'nuevo@example.com',
        password: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersServiceMock.create.mockResolvedValue(createdUser);

      const result = await service.register({
        email: 'nuevo@example.com',
        password: 'secret123',
      });

      expect(usersServiceMock.create).toHaveBeenCalledWith({
        email: 'nuevo@example.com',
        password: 'secret123',
      });
      expect(result).toBe(createdUser);
    });
  });
});

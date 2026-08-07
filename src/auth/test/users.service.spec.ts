import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RegisterDto } from '../dto/register.dto';
import { User } from '../entity/user.entity';
import { UsersService } from '../service/users.service';

describe('UsersService', () => {
  let service: UsersService;

  const existingUser = {
    id: 'uuid-1',
    email: 'test@example.com',
    password: 'hash-existente',
  } as User;

  const repositoryMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repositoryMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('hashea la contraseña y guarda el usuario', async () => {
      repositoryMock.findOne.mockResolvedValue(null);
      repositoryMock.create.mockImplementation((dto: RegisterDto) => ({
        ...dto,
      }));
      repositoryMock.save.mockResolvedValue({
        ...existingUser,
        password: 'hash-generado',
      });

      const result = await service.create({
        email: 'test@example.com',
        password: 'secret123',
      });

      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
      expect(result.email).toBe('test@example.com');
      expect(result.password).toBe('hash-generado');
      expect(result.password).not.toBe('secret123');
    });

    it('lanza ConflictException si el email ya existe', async () => {
      repositoryMock.findOne.mockResolvedValue(existingUser);

      await expect(
        service.create({ email: 'test@example.com', password: 'secret123' }),
      ).rejects.toThrow(ConflictException);

      expect(repositoryMock.save).not.toHaveBeenCalled();
    });
  });
});

import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryListDto } from '../dto/query-list.dto';
import { Character } from '../entity/character.entity';
import {
  RickMortyApiClient,
  RickMortyCharacterRaw,
} from '../service/rickmorty-api.client';
import { CharactersService } from '../service/characters.service';

const makeRaw = (id: number): RickMortyCharacterRaw => ({
  id,
  name: `Personaje ${id}`,
  status: 'Alive',
  species: 'Human',
  type: '',
  gender: 'Male',
  origin: { name: 'Tierra', url: '' },
  location: { name: 'Tierra', url: '' },
  image: '',
  url: `https://rickandmortyapi.com/api/character/${id}`,
  created: '2017-11-04T18:48:46.250Z',
});

describe('CharactersService', () => {
  let service: CharactersService;

  const rickMortyApiClientMock = {
    getCharactersAfter: jest.fn(),
  };

  const configServiceMock = {
    get: jest.fn((key: string) =>
      key === 'RICKMORTY_BATCH_SIZE' ? 10 : undefined,
    ),
  };

  const repositoryMock = {
    count: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    insert: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const maxIdQueryBuilderMock = {
    select: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharactersService,
        { provide: getRepositoryToken(Character), useValue: repositoryMock },
        { provide: RickMortyApiClient, useValue: rickMortyApiClientMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<CharactersService>(CharactersService);
  });

  describe('sync (de a 10 y avanza)', () => {
    it('inserta 10 cuando la tabla está vacía', async () => {
      repositoryMock.createQueryBuilder.mockReturnValue(maxIdQueryBuilderMock);
      maxIdQueryBuilderMock.getRawOne.mockResolvedValue({ maxId: '0' });
      rickMortyApiClientMock.getCharactersAfter.mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => makeRaw(i + 1)),
      );
      repositoryMock.findOne.mockResolvedValue(null);

      const result = await service.sync();

      expect(result).toEqual({ inserted: 10, updated: 0 });
      expect(rickMortyApiClientMock.getCharactersAfter).toHaveBeenCalledWith(
        0,
        10,
      );
    });

    it('avanza: pide los siguientes 10 a partir del último id', async () => {
      repositoryMock.createQueryBuilder.mockReturnValue(maxIdQueryBuilderMock);
      maxIdQueryBuilderMock.getRawOne.mockResolvedValue({ maxId: '10' });
      rickMortyApiClientMock.getCharactersAfter.mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => makeRaw(i + 11)),
      );
      repositoryMock.findOne.mockResolvedValue(null);

      const result = await service.sync();

      expect(result).toEqual({ inserted: 10, updated: 0 });
      expect(rickMortyApiClientMock.getCharactersAfter).toHaveBeenCalledWith(
        10,
        10,
      );
    });

    it('no inserta nada cuando la API ya no tiene más personajes', async () => {
      repositoryMock.createQueryBuilder.mockReturnValue(maxIdQueryBuilderMock);
      maxIdQueryBuilderMock.getRawOne.mockResolvedValue({ maxId: '826' });
      rickMortyApiClientMock.getCharactersAfter.mockResolvedValue([]);

      const result = await service.sync();

      expect(result).toEqual({ inserted: 0, updated: 0 });
      expect(rickMortyApiClientMock.getCharactersAfter).toHaveBeenCalledWith(
        826,
        10,
      );
    });

    it('actualiza cuando el personaje ya existe', async () => {
      repositoryMock.createQueryBuilder.mockReturnValue(maxIdQueryBuilderMock);
      maxIdQueryBuilderMock.getRawOne.mockResolvedValue({ maxId: '0' });
      rickMortyApiClientMock.getCharactersAfter.mockResolvedValue([makeRaw(1)]);
      repositoryMock.findOne.mockResolvedValue({ id: 1 });

      const result = await service.sync();

      expect(result).toEqual({ inserted: 0, updated: 1 });
      expect(repositoryMock.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('devuelve data paginada con meta', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[makeRaw(1)], 826]),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);

      const dto = { page: 1, limit: 10 } as QueryListDto;
      const result = await service.findAll(dto);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 826,
        page: 1,
        limit: 10,
        totalPages: 83,
      });
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException si el personaje no existe', async () => {
      repositoryMock.findOne.mockResolvedValue(null);

      await expect(service.findOne('9999')).rejects.toThrow(NotFoundException);
    });

    it('lanza NotFoundException si el id no es numérico', async () => {
      await expect(service.findOne('abc')).rejects.toThrow(NotFoundException);
    });

    it('devuelve el personaje si existe', async () => {
      repositoryMock.findOne.mockResolvedValue({ id: 1, name: 'Rick Sanchez' });

      const result = await service.findOne('1');

      expect(result).toEqual({ id: 1, name: 'Rick Sanchez' });
    });
  });
});

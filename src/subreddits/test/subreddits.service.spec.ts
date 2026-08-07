import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryListDto } from '../dto/query-list.dto';
import { Subreddit } from '../entity/subreddit.entity';
import { RedditApiClient } from '../service/reddit-api.client';
import { SubredditsService } from '../service/subreddits.service';

describe('SubredditsService', () => {
  let service: SubredditsService;

  const raw = {
    id: '2qh1i',
    display_name: 'AskReddit',
    title: 'AskReddit',
    public_description: 'Desc',
    description: null,
    subscribers: 100,
    url: '/r/AskReddit/',
    over18: false,
    created_utc: 1201233135,
    icon_img: '',
    banner_img: '',
  };

  const redditApiClientMock = {
    getSubreddits: jest.fn(),
  };

  const repositoryMock = {
    count: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    insert: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubredditsService,
        { provide: getRepositoryToken(Subreddit), useValue: repositoryMock },
        { provide: RedditApiClient, useValue: redditApiClientMock },
      ],
    }).compile();

    service = module.get<SubredditsService>(SubredditsService);
  });

  describe('sync', () => {
    it('inserta nuevos y actualiza existentes, y mapea los campos de Reddit', async () => {
      redditApiClientMock.getSubreddits.mockResolvedValue([raw]);
      repositoryMock.findOne.mockResolvedValueOnce(null);

      const result = await service.sync();

      expect(result).toEqual({ inserted: 1, updated: 0 });
      expect(repositoryMock.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '2qh1i',
          name: 'AskReddit',
          title: 'AskReddit',
          subscribers: 100,
          over18: false,
          createdUtc: 1201233135,
          fetchedAt: expect.any(Date) as unknown,
        }),
      );
    });

    it('actualiza cuando el subreddit ya existe', async () => {
      redditApiClientMock.getSubreddits.mockResolvedValue([raw]);
      repositoryMock.findOne.mockResolvedValueOnce({ id: '2qh1i' });

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
        getManyAndCount: jest.fn().mockResolvedValue([[raw], 25]),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);

      const dto = { page: 1, limit: 10 } as QueryListDto;
      const result = await service.findAll(dto);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
      });
      expect(qb.orderBy).toHaveBeenCalledWith('sub.subscribers', 'DESC');
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException si el subreddit no existe', async () => {
      repositoryMock.findOne.mockResolvedValue(null);

      await expect(service.findOne('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devuelve el subreddit si existe', async () => {
      repositoryMock.findOne.mockResolvedValue({
        id: '2qh1i',
        name: 'AskReddit',
      });

      const result = await service.findOne('2qh1i');

      expect(result).toEqual({ id: '2qh1i', name: 'AskReddit' });
    });
  });
});

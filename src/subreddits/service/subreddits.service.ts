import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryListDto, SortOrder } from '../dto/query-list.dto';
import { Subreddit } from '../entity/subreddit.entity';
import { RedditApiClient, RedditSubredditRaw } from './reddit-api.client';

const SORTABLE_COLUMNS: Record<string, string> = {
  name: 'sub.name',
  subscribers: 'sub.subscribers',
  createdUtc: 'sub.createdUtc',
};

const DEFAULT_SORT_COLUMN = 'sub.subscribers';

@Injectable()
export class SubredditsService implements OnModuleInit {
  constructor(
    @InjectRepository(Subreddit)
    private readonly subredditsRepository: Repository<Subreddit>,
    private readonly redditApiClient: RedditApiClient,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.subredditsRepository.count();

    if (count === 0) {
      try {
        await this.sync();
      } catch {
        // Tolerante: si Reddit falla al arrancar, se puede sincronizar manualmente.
      }
    }
  }

  async sync(): Promise<{ inserted: number; updated: number }> {
    const subreddits = await this.redditApiClient.getSubreddits();
    let inserted = 0;
    let updated = 0;

    for (const raw of subreddits) {
      const existing = await this.subredditsRepository.findOne({
        where: { id: raw.id },
      });

      const data = this.toEntity(raw);

      if (existing) {
        await this.subredditsRepository.update(existing.id, data);
        updated += 1;
      } else {
        await this.subredditsRepository.insert(data);
        inserted += 1;
      }
    }

    return { inserted, updated };
  }

  async findAll(query: QueryListDto) {
    const { page, limit, search, over18 } = query;

    const sortColumn =
      SORTABLE_COLUMNS[query.sortBy ?? 'subscribers'] ?? DEFAULT_SORT_COLUMN;
    const sortDirection =
      (query.order ?? SortOrder.Desc).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.subredditsRepository.createQueryBuilder('sub');

    if (search) {
      qb.where('sub.name LIKE :search OR sub.title LIKE :search', {
        search: `%${search}%`,
      });
    }

    if (over18 !== undefined) {
      qb.andWhere('sub.over18 = :over18', { over18 });
    }

    const [items, total] = await qb
      .orderBy(sortColumn, sortDirection)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Subreddit> {
    const subreddit = await this.subredditsRepository.findOne({
      where: { id },
    });

    if (!subreddit) {
      throw new NotFoundException('Subreddit no encontrado');
    }

    return subreddit;
  }

  private toEntity(raw: RedditSubredditRaw): Partial<Subreddit> {
    return {
      id: raw.id,
      name: raw.display_name,
      title: raw.title,
      publicDescription: raw.public_description ?? null,
      description: raw.description ?? null,
      subscribers: raw.subscribers ?? 0,
      url: raw.url,
      over18: raw.over18 ?? false,
      createdUtc: raw.created_utc ?? 0,
      iconImg: raw.icon_img ?? null,
      bannerImg: raw.banner_img ?? null,
      fetchedAt: new Date(),
    };
  }
}

import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryListDto, SortOrder } from '../dto/query-list.dto';
import { Character } from '../entity/character.entity';
import {
  RickMortyApiClient,
  RickMortyCharacterRaw,
} from './rickmorty-api.client';

const SORTABLE_COLUMNS: Record<string, string> = {
  name: 'char.name',
  id: 'char.id',
  created: 'char.created',
};

const DEFAULT_SORT_COLUMN = 'char.id';
const DEFAULT_BATCH_SIZE = 10;

@Injectable()
export class CharactersService implements OnModuleInit {
  constructor(
    @InjectRepository(Character)
    private readonly charactersRepository: Repository<Character>,
    private readonly rickMortyApiClient: RickMortyApiClient,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.charactersRepository.count();

    if (count === 0) {
      try {
        await this.sync();
      } catch {
        // Tolerante: si la API falla al arrancar, se puede sincronizar manualmente.
      }
    }
  }

  async sync(): Promise<{ inserted: number; updated: number }> {
    const batchSize =
      this.configService.get<number>('RICKMORTY_BATCH_SIZE') ??
      DEFAULT_BATCH_SIZE;

    const maxId = await this.getMaxId();
    const batch = await this.rickMortyApiClient.getCharactersAfter(
      maxId,
      batchSize,
    );

    if (batch.length === 0) {
      return { inserted: 0, updated: 0 };
    }

    let inserted = 0;
    let updated = 0;

    for (const raw of batch) {
      const result = await this.upsertOne(raw);

      if (result === 'inserted') {
        inserted += 1;
      } else {
        updated += 1;
      }
    }

    return { inserted, updated };
  }

  private async getMaxId(): Promise<number> {
    const row = await this.charactersRepository
      .createQueryBuilder('char')
      .select('MAX(char.id)', 'maxId')
      .getRawOne<{ maxId: string }>();

    return row?.maxId ? Number(row.maxId) : 0;
  }

  async findAll(query: QueryListDto) {
    const { page, limit, search, status, species, gender } = query;

    const sortColumn =
      SORTABLE_COLUMNS[query.sortBy ?? 'id'] ?? DEFAULT_SORT_COLUMN;
    const sortDirection =
      (query.order ?? SortOrder.Desc).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.charactersRepository.createQueryBuilder('char');

    if (search) {
      qb.where('char.name LIKE :search', { search: `%${search}%` });
    }

    if (status) {
      qb.andWhere('char.status = :status', { status });
    }

    if (species) {
      qb.andWhere('char.species = :species', { species });
    }

    if (gender) {
      qb.andWhere('char.gender = :gender', { gender });
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

  async findOne(id: string): Promise<Character> {
    const numericId = Number(id);

    if (!Number.isInteger(numericId)) {
      throw new NotFoundException('Personaje no encontrado');
    }

    const character = await this.charactersRepository.findOne({
      where: { id: numericId },
    });

    if (!character) {
      throw new NotFoundException('Personaje no encontrado');
    }

    return character;
  }

  private async upsertOne(
    raw: RickMortyCharacterRaw,
  ): Promise<'inserted' | 'updated'> {
    const existing = await this.charactersRepository.findOne({
      where: { id: raw.id },
    });

    const data = this.toEntity(raw);

    if (existing) {
      await this.charactersRepository.update(existing.id, data);
      return 'updated';
    }

    await this.charactersRepository.insert(data);
    return 'inserted';
  }

  private toEntity(raw: RickMortyCharacterRaw): Partial<Character> {
    return {
      id: raw.id,
      name: raw.name,
      status: raw.status,
      species: raw.species,
      type: raw.type ?? '',
      gender: raw.gender,
      originName: raw.origin?.name ?? null,
      locationName: raw.location?.name ?? null,
      image: raw.image ?? null,
      url: raw.url ?? null,
      created: new Date(raw.created),
      fetchedAt: new Date(),
    };
  }
}

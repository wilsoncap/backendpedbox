import {
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { RickMortyApiClient } from '../service/rickmorty-api.client';

describe('RickMortyApiClient', () => {
  let client: RickMortyApiClient;

  const configServiceMock = {
    getOrThrow: jest.fn((key: string) =>
      key === 'RICKMORTY_API_URL'
        ? 'https://rickandmortyapi.com/api/character'
        : undefined,
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RickMortyApiClient,
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    client = module.get<RickMortyApiClient>(RickMortyApiClient);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('devuelve los resultados y el cursor next de la página', async () => {
    const mockResponse = {
      ok: true,
      json: () => ({
        info: { next: 'https://rickandmortyapi.com/api/character?page=2' },
        results: [
          {
            id: 1,
            name: 'Rick Sanchez',
            status: 'Alive',
            species: 'Human',
            type: '',
            gender: 'Male',
            origin: { name: 'Earth (C-137)', url: '' },
            location: { name: 'Citadel of Ricks', url: '' },
            image: '',
            url: 'https://rickandmortyapi.com/api/character/1',
            created: '2017-11-04T18:48:46.250Z',
          },
        ],
      }),
    } as Response;

    jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

    const page = await client.getCharacterPage();

    expect(page.results).toHaveLength(1);
    expect(page.results[0].id).toBe(1);
    expect(page.results[0].name).toBe('Rick Sanchez');
    expect(page.next).toBe('https://rickandmortyapi.com/api/character?page=2');
  });

  it('lanza ServiceUnavailableException si la API no responde', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network'));

    await expect(client.getCharacterPage()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('lanza BadGatewayException si la API responde con error HTTP', async () => {
    const mockResponse = { ok: false, status: 500 } as Response;

    jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

    await expect(client.getCharacterPage()).rejects.toThrow(
      BadGatewayException,
    );
  });

  it('getCharactersAfter filtra por id mayor al mínimo y respeta el límite', async () => {
    const results = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Personaje ${i + 1}`,
      status: 'Alive',
      species: 'Human',
      type: '',
      gender: 'Male',
      origin: { name: 'Tierra', url: '' },
      location: { name: 'Tierra', url: '' },
      image: '',
      url: `https://rickandmortyapi.com/api/character/${i + 1}`,
      created: '2017-11-04T18:48:46.250Z',
    }));

    const mockResponse = {
      ok: true,
      json: () => ({ info: { next: null }, results }),
    } as Response;

    jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

    const result = await client.getCharactersAfter(10, 10);

    expect(result).toHaveLength(10);
    expect(result[0].id).toBe(11);
    expect(result[9].id).toBe(20);
  });
});

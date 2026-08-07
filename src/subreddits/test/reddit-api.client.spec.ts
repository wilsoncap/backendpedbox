import {
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { RedditApiClient } from '../service/reddit-api.client';

describe('RedditApiClient', () => {
  let client: RedditApiClient;

  const configServiceMock = {
    getOrThrow: jest.fn((key: string) =>
      key === 'REDDIT_JSON_URL'
        ? 'https://www.reddit.com/reddits.json'
        : 'test-agent/1.0',
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedditApiClient,
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    client = module.get<RedditApiClient>(RedditApiClient);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('mapea los children del JSON de Reddit', async () => {
    const mockResponse = {
      ok: true,
      json: () => ({
        data: {
          children: [
            {
              data: {
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
              },
            },
          ],
        },
      }),
    } as Response;

    jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

    const result = await client.getSubreddits();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2qh1i');
    expect(result[0].display_name).toBe('AskReddit');
  });

  it('lanza ServiceUnavailableException si Reddit no responde', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network'));

    await expect(client.getSubreddits()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('lanza BadGatewayException si Reddit responde con error HTTP', async () => {
    const mockResponse = { ok: false, status: 429 } as Response;

    jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

    await expect(client.getSubreddits()).rejects.toThrow(BadGatewayException);
  });
});

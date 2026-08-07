import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RedditSubredditRaw {
  id: string;
  display_name: string;
  title: string;
  public_description?: string | null;
  description?: string | null;
  subscribers: number;
  url: string;
  over18: boolean;
  created_utc: number;
  icon_img?: string | null;
  banner_img?: string | null;
}

interface RedditListing {
  data?: {
    children?: { data: RedditSubredditRaw }[];
  };
}

const TIMEOUT_MS = 10000;

@Injectable()
export class RedditApiClient {
  constructor(private readonly configService: ConfigService) {}

  async getSubreddits(): Promise<RedditSubredditRaw[]> {
    const url = this.configService.getOrThrow<string>('REDDIT_JSON_URL');
    const userAgent =
      this.configService.getOrThrow<string>('REDDIT_USER_AGENT');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': userAgent, Accept: 'application/json' },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new BadGatewayException(
          `Reddit respondió con el estado ${response.status}`,
        );
      }

      const listing = (await response.json()) as RedditListing;
      const children = listing.data?.children ?? [];

      return children
        .map((child) => child.data)
        .filter((item) => item && item.id && item.display_name);
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }
      throw new ServiceUnavailableException(
        'No se pudo obtener la información de Reddit',
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

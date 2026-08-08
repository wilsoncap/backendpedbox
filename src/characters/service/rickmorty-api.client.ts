import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RickMortyCharacterRaw {
  id: number;
  name: string;
  status: string;
  species: string;
  type: string;
  gender: string;
  origin: { name: string; url: string };
  location: { name: string; url: string };
  image: string;
  url: string;
  created: string;
}

export interface CharacterPage {
  results: RickMortyCharacterRaw[];
  next: string | null;
}

const TIMEOUT_MS = 10000;
const PAGE_SIZE = 20;

@Injectable()
export class RickMortyApiClient {
  constructor(private readonly configService: ConfigService) {}

  async getCharacterPage(url?: string): Promise<CharacterPage> {
    const baseUrl = this.configService.getOrThrow<string>('RICKMORTY_API_URL');
    const target = url ?? baseUrl;

    const response = await this.fetchWithTimeout(target);

    if (!response.ok) {
      throw new BadGatewayException(
        `Rick & Morty respondió con el estado ${response.status}`,
      );
    }

    const body = (await response.json()) as {
      info?: { next?: string | null };
      results?: RickMortyCharacterRaw[];
    };

    return {
      results: body.results ?? [],
      next: body.info?.next ?? null,
    };
  }

  async getCharactersAfter(
    minId: number,
    limit: number,
  ): Promise<RickMortyCharacterRaw[]> {
    const baseUrl = this.configService.getOrThrow<string>('RICKMORTY_API_URL');
    const startPage = Math.floor(minId / PAGE_SIZE) + 1;
    const separator = baseUrl.includes('?') ? '&' : '?';

    const result: RickMortyCharacterRaw[] = [];
    let url = `${baseUrl}${separator}page=${startPage}`;

    while (result.length < limit) {
      const page = await this.getCharacterPage(url);
      const batch = page.results.filter((character) => character.id > minId);

      result.push(...batch);

      if (result.length >= limit || !page.next) {
        break;
      }

      url = page.next;
    }

    return result.slice(0, limit);
  }

  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      return await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
    } catch {
      throw new ServiceUnavailableException(
        'No se pudo obtener la información de Rick & Morty',
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

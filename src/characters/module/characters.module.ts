import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CharactersController } from '../controller/characters.controller';
import { Character } from '../entity/character.entity';
import { CharactersService } from '../service/characters.service';
import { RickMortyApiClient } from '../service/rickmorty-api.client';

@Module({
  imports: [TypeOrmModule.forFeature([Character])],
  controllers: [CharactersController],
  providers: [CharactersService, RickMortyApiClient],
})
export class CharactersModule {}

import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { QueryListDto } from '../dto/query-list.dto';
import { CharactersService } from '../service/characters.service';

@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Post('sync')
  sync() {
    return this.charactersService.sync();
  }

  @Get()
  findAll(@Query() query: QueryListDto) {
    return this.charactersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.charactersService.findOne(id);
  }
}

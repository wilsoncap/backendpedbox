import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { QueryListDto } from '../dto/query-list.dto';
import { SubredditsService } from '../service/subreddits.service';

@Controller('subreddits')
export class SubredditsController {
  constructor(private readonly subredditsService: SubredditsService) {}

  @Post('sync')
  sync() {
    return this.subredditsService.sync();
  }

  @Get()
  findAll(@Query() query: QueryListDto) {
    return this.subredditsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subredditsService.findOne(id);
  }
}

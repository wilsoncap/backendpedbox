import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubredditsController } from '../controller/subreddits.controller';
import { Subreddit } from '../entity/subreddit.entity';
import { RedditApiClient } from '../service/reddit-api.client';
import { SubredditsService } from '../service/subreddits.service';

@Module({
  imports: [TypeOrmModule.forFeature([Subreddit])],
  controllers: [SubredditsController],
  providers: [SubredditsService, RedditApiClient],
})
export class SubredditsModule {}

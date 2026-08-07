import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/module/auth.module';
import { validate } from './config/validation/env.validation';
import { typeOrmConfig } from './database/config/typeorm.config';
import { SubredditsModule } from './subreddits/module/subreddits.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),
    AuthModule,
    SubredditsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

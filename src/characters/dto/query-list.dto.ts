import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum SortBy {
  Name = 'name',
  Id = 'id',
  Created = 'created',
}

export enum SortOrder {
  Asc = 'asc',
  Desc = 'desc',
}

export class QueryListDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  species?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsEnum(SortBy)
  sortBy: SortBy = SortBy.Id;

  @IsOptional()
  @IsEnum(SortOrder)
  order: SortOrder = SortOrder.Desc;
}

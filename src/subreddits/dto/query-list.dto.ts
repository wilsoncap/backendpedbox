import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum SortBy {
  Name = 'name',
  Subscribers = 'subscribers',
  CreatedUtc = 'createdUtc',
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
  @IsEnum(SortBy)
  sortBy: SortBy = SortBy.Subscribers;

  @IsOptional()
  @IsEnum(SortOrder)
  order: SortOrder = SortOrder.Desc;

  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown => {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return value;
  })
  @IsBoolean()
  over18?: boolean;
}

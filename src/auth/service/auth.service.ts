import { Injectable } from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';
import { User } from '../entity/user.entity';
import { UsersService } from './users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register(dto: RegisterDto): Promise<User> {
    return this.usersService.create(dto);
  }
}

import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, CreateUserDto } from '@turbovets/data';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async findById(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['organization'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['organization'],
    });
  }

  async findAllInOrganization(organizationId: number) {
    return this.usersRepository.find({
      where: { organization: { id: organizationId } },
      relations: ['organization'],
    });
  }

  async update(id: number, updateData: Partial<User>) {
    const user = await this.findById(id);
    Object.assign(user, updateData);
    return this.usersRepository.save(user);
  }
}

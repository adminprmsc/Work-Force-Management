import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '../../../domain/entities/user.entity';
import { HASHING_SERVICE } from '../../ports/hashing.service.port';
import type { HashingServicePort } from '../../ports/hashing.service.port';
import { LoginInput, LoginUseCasePort } from '../../ports/login.use-case.port';
import { USER_REPOSITORY } from '../../ports/user.repository.port';
import type { UserRepositoryPort } from '../../ports/user.repository.port';
import { User } from '../../../domain/entities/user.entity';

export type { LoginInput };

@Injectable()
export class LoginUseCase implements LoginUseCasePort {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(HASHING_SERVICE)
    private readonly hashingService: HashingServicePort,
  ) {}

  async execute(input: LoginInput): Promise<User> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.hashingService.compare(
      input.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is inactive');
    }

    return user;
  }
}

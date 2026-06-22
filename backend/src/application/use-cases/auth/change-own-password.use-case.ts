import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  HASHING_SERVICE,
  HashingServicePort,
} from '../../ports/hashing.service.port';
import {
  USER_REPOSITORY,
  UserRepositoryPort,
} from '../../ports/user.repository.port';

@Injectable()
export class ChangeOwnPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryPort,
    @Inject(HASHING_SERVICE)
    private readonly hashingService: HashingServicePort,
  ) {}

  async execute(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentValid = await this.hashingService.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from your current password',
      );
    }

    const hashedPassword = await this.hashingService.hash(newPassword);
    await this.userRepository.update(userId, {
      password: hashedPassword,
      mustChangePassword: false,
    });
  }
}

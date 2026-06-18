import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { HashingServicePort } from '../../application/ports/hashing.service.port';

const SALT_ROUNDS = 12;

@Injectable()
export class BcryptHashingService implements HashingServicePort {
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}

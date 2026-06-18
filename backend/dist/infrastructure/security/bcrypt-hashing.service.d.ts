import { HashingServicePort } from '../../application/ports/hashing.service.port';
export declare class BcryptHashingService implements HashingServicePort {
    hash(plain: string): Promise<string>;
    compare(plain: string, hashed: string): Promise<boolean>;
}

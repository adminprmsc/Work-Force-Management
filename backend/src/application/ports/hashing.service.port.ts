export abstract class HashingServicePort {
  abstract hash(plain: string): Promise<string>;
  abstract compare(plain: string, hashed: string): Promise<boolean>;
}

export const HASHING_SERVICE = Symbol('HASHING_SERVICE');

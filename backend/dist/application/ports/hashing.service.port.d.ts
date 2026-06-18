export declare abstract class HashingServicePort {
    abstract hash(plain: string): Promise<string>;
    abstract compare(plain: string, hashed: string): Promise<boolean>;
}
export declare const HASHING_SERVICE: unique symbol;

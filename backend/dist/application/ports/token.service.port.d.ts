export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
}
export declare abstract class TokenServicePort {
    abstract generateAccessToken(payload: JwtPayload): Promise<string>;
}
export declare const TOKEN_SERVICE: unique symbol;

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export abstract class TokenServicePort {
  abstract generateAccessToken(payload: JwtPayload): Promise<string>;
}

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

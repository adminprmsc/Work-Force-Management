import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, TokenServicePort } from '../../application/ports/token.service.port';
export declare class JwtTokenService implements TokenServicePort {
    private readonly jwtService;
    private readonly configService;
    constructor(jwtService: JwtService, configService: ConfigService);
    generateAccessToken(payload: JwtPayload): Promise<string>;
}

import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { JwtPayload } from '../../../application/ports/token.service.port';
import { GetUserByIdUseCase } from '../../../application/use-cases/auth/get-user-by-id.use-case';
import { AuthenticatedUser } from '../types/auth.types';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly getUserByIdUseCase;
    constructor(configService: ConfigService, getUserByIdUseCase: GetUserByIdUseCase);
    validate(payload: JwtPayload): Promise<AuthenticatedUser>;
}
export {};

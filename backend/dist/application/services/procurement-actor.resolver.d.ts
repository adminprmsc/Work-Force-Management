import { ProcurementActorContext } from '../../domain/policies/procurement-access.policy';
import { OfficeRepositoryPort } from '../ports/office.repository.port';
import { UserRepositoryPort } from '../ports/user.repository.port';
import type { AuthenticatedUser } from '../types/authenticated-user.type';
export declare class ProcurementActorResolver {
    private readonly userRepository;
    private readonly officeRepository;
    constructor(userRepository: UserRepositoryPort, officeRepository: OfficeRepositoryPort);
    resolve(user: AuthenticatedUser): Promise<ProcurementActorContext>;
    assertManageMasters(actor: ProcurementActorContext): void;
}
export declare function normalizeName(name: string): string;

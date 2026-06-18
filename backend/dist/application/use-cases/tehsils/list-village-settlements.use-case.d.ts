import { Settlement } from '../../../domain/entities/location.entity';
import { TehsilRepositoryPort } from '../../ports/tehsil.repository.port';
export declare class ListVillageSettlementsUseCase {
    private readonly tehsilRepository;
    constructor(tehsilRepository: TehsilRepositoryPort);
    execute(villageId: string): Promise<Settlement[]>;
}

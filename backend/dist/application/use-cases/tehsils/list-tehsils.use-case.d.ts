import { Tehsil, Village } from '../../../domain/entities/location.entity';
import { TehsilRepositoryPort } from '../../ports/tehsil.repository.port';
export declare class ListTehsilsUseCase {
    private readonly tehsilRepository;
    constructor(tehsilRepository: TehsilRepositoryPort);
    execute(): Promise<Tehsil[]>;
}
export declare class ListTehsilVillagesUseCase {
    private readonly tehsilRepository;
    constructor(tehsilRepository: TehsilRepositoryPort);
    execute(tehsilId: string): Promise<Village[]>;
}

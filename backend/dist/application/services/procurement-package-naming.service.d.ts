import { type TehsilPackageNaming } from '../../domain/constants/tehsil-package-naming';
import { TehsilRepositoryPort } from '../ports/tehsil.repository.port';
export type TehsilNamingPreview = {
    tehsilDisplayName: string;
    suggestedZoneLabel: string | null;
    suggestedAbbrev: string | null;
    naming: TehsilPackageNaming | null;
};
export declare class ProcurementPackageNamingService {
    private readonly tehsilRepository;
    constructor(tehsilRepository: TehsilRepositoryPort);
    previewTehsilNaming(tehsilId: string): Promise<TehsilNamingPreview>;
    resolvePackageName(namePart: string, tehsilId: string): Promise<string>;
}

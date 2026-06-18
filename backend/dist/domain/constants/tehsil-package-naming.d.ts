export type TehsilPackageNaming = {
    zoneLabel: string;
    displayLabel: string;
    abbrev: string;
    groupKey: string;
};
export declare const TEHSIL_PACKAGE_NAMING: Record<string, TehsilPackageNaming>;
export declare function getTehsilPackageNaming(tehsilName: string): TehsilPackageNaming | null;
export declare function getTehsilDisplayName(tehsilName: string): string;
export declare function composeProcurementPackageName(zoneLabel: string, tehsilDisplayName: string, packageCode: string, contractSuffix: string): string;
export declare function composePackageNameWithTehsil(namePart: string, tehsilDisplayName: string): string;
export declare function stripTehsilFromPackageName(fullName: string, tehsilDisplayName: string): string;
export declare function getTehsilNamesForGroup(groupKey: string): string[];

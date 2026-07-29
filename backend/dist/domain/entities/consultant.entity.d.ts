export declare class Consultant {
    readonly id: string;
    readonly name: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly linkedPackageNames: string[];
    constructor(id: string, name: string, createdAt: Date, updatedAt: Date, linkedPackageNames?: string[]);
}

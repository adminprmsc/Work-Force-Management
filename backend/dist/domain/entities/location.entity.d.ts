export declare class Tehsil {
    readonly id: string;
    readonly name: string;
    readonly createdAt: Date;
    readonly villageCount?: number | undefined;
    constructor(id: string, name: string, createdAt: Date, villageCount?: number | undefined);
}
export declare class Village {
    readonly id: string;
    readonly name: string;
    readonly tehsilId: string;
    readonly createdAt: Date;
    readonly settlementCount?: number | undefined;
    constructor(id: string, name: string, tehsilId: string, createdAt: Date, settlementCount?: number | undefined);
}
export declare class Settlement {
    readonly id: string;
    readonly name: string;
    readonly villageId: string;
    readonly createdAt: Date;
    constructor(id: string, name: string, villageId: string, createdAt: Date);
}

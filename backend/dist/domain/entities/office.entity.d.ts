import { OfficeType } from './user.entity';
export declare class Office {
    readonly id: string;
    readonly type: OfficeType;
    readonly name: string;
    readonly tehsilId: string | null;
    readonly tehsilName: string | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    constructor(id: string, type: OfficeType, name: string, tehsilId: string | null, tehsilName: string | null, createdAt: Date, updatedAt: Date);
}

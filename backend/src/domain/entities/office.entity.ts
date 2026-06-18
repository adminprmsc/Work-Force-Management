import { OfficeType } from './user.entity';

export class Office {
  constructor(
    public readonly id: string,
    public readonly type: OfficeType,
    public readonly name: string,
    public readonly tehsilId: string | null,
    public readonly tehsilName: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

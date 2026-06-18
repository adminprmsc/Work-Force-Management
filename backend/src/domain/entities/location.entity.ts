export class Tehsil {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly createdAt: Date,
    public readonly villageCount?: number,
  ) {}
}

export class Village {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly tehsilId: string,
    public readonly createdAt: Date,
    public readonly settlementCount?: number,
  ) {}
}

export class Settlement {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly villageId: string,
    public readonly createdAt: Date,
  ) {}
}

import type { PrismaClient } from '@prisma/client';
import { OfficeType } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  LOCATION_DATA,
  SETTLEMENT_DATA,
  TEHSIL_OPTIONS,
} from './data/location-data';
import { tehsilRaEmail } from './data/tehsils';

const CANONICAL_TEHSILS = [...TEHSIL_OPTIONS];

async function pruneNonCanonicalGeography(prisma: PrismaClient): Promise<void> {
  const removedTehsils = await prisma.tehsil.deleteMany({
    where: { name: { notIn: CANONICAL_TEHSILS } },
  });

  const canonicalTehsils = await prisma.tehsil.findMany({
    where: { name: { in: CANONICAL_TEHSILS } },
    include: {
      villages: {
        include: { settlements: true },
      },
    },
  });

  let removedVillages = 0;
  let removedSettlements = 0;

  for (const tehsil of canonicalTehsils) {
    const allowedVillages = new Set(LOCATION_DATA[tehsil.name] ?? []);

    for (const village of tehsil.villages) {
      if (!allowedVillages.has(village.name)) {
        await prisma.village.delete({ where: { id: village.id } });
        removedVillages += 1;
        continue;
      }

      const allowedSettlements = new Set(SETTLEMENT_DATA[village.name] ?? []);
      for (const settlement of village.settlements) {
        if (!allowedSettlements.has(settlement.name)) {
          await prisma.settlement.delete({ where: { id: settlement.id } });
          removedSettlements += 1;
        }
      }
    }
  }

  const removedRaUsers = await prisma.user.deleteMany({
    where: {
      role: 'RA_ES_TEHSIL',
      OR: [
        { officeId: null },
        {
          email: {
            notIn: CANONICAL_TEHSILS.map((name) => tehsilRaEmail(name)),
          },
        },
      ],
    },
  });

  if (
    removedTehsils.count > 0 ||
    removedVillages > 0 ||
    removedSettlements > 0 ||
    removedRaUsers.count > 0
  ) {
    console.log(
      `Pruned non-canonical data: ${removedTehsils.count} tehsils, ${removedVillages} villages, ${removedSettlements} settlements, ${removedRaUsers.count} RA users`,
    );
  }
}

async function upsertCanonicalGeography(prisma: PrismaClient): Promise<void> {
  for (const name of CANONICAL_TEHSILS) {
    const tehsil = await prisma.tehsil.upsert({
      where: { name },
      update: {},
      create: { id: randomUUID(), name },
    });

    const villages = LOCATION_DATA[name] ?? [];
    for (const villageName of villages) {
      const village = await prisma.village.upsert({
        where: {
          tehsilId_name: { tehsilId: tehsil.id, name: villageName },
        },
        update: {},
        create: {
          id: randomUUID(),
          name: villageName,
          tehsilId: tehsil.id,
        },
      });

      const settlements = SETTLEMENT_DATA[villageName] ?? [];
      for (const settlementName of settlements) {
        await prisma.settlement.upsert({
          where: {
            villageId_name: { villageId: village.id, name: settlementName },
          },
          update: {},
          create: {
            id: randomUUID(),
            name: settlementName,
            villageId: village.id,
          },
        });
      }
    }

    const officeName = `${name} Tehsil Office`;
    await prisma.office.upsert({
      where: { tehsilId: tehsil.id },
      update: { name: officeName, type: OfficeType.TEHSIL_OFFICE },
      create: {
        type: OfficeType.TEHSIL_OFFICE,
        name: officeName,
        tehsilId: tehsil.id,
      },
    });
  }
}

export async function seedGeography(prisma: PrismaClient): Promise<void> {
  await pruneNonCanonicalGeography(prisma);
  await upsertCanonicalGeography(prisma);

  const tehsilCount = await prisma.tehsil.count();
  const villageCount = await prisma.village.count();
  const settlementCount = await prisma.settlement.count();
  const tehsilOfficeCount = await prisma.office.count({
    where: { type: OfficeType.TEHSIL_OFFICE },
  });

  console.log(
    `Geography seeded: ${tehsilCount} tehsils, ${villageCount} villages, ${settlementCount} settlements, ${tehsilOfficeCount} tehsil offices`,
  );

  if (tehsilCount !== CANONICAL_TEHSILS.length) {
    throw new Error(
      `Expected ${CANONICAL_TEHSILS.length} tehsils after seed, found ${tehsilCount}`,
    );
  }
}

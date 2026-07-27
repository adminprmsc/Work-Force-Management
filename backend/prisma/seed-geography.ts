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

/**
 * Removes non-canonical geography only when it is unused.
 * Villages/settlements added via Manage Geography (or linked to packages /
 * survey responses) are preserved so production deploys stay idempotent.
 */
async function pruneNonCanonicalGeography(prisma: PrismaClient): Promise<void> {
  const nonCanonicalTehsils = await prisma.tehsil.findMany({
    where: { name: { notIn: CANONICAL_TEHSILS } },
    select: { id: true, name: true },
  });

  let removedTehsils = 0;
  let skippedTehsils = 0;
  for (const tehsil of nonCanonicalTehsils) {
    const [villageCount, packageCount, responseCount] = await Promise.all([
      prisma.village.count({ where: { tehsilId: tehsil.id } }),
      prisma.procurementPackage.count({ where: { tehsilId: tehsil.id } }),
      prisma.surveyResponse.count({
        where: { village: { tehsilId: tehsil.id } },
      }),
    ]);
    if (villageCount > 0 || packageCount > 0 || responseCount > 0) {
      skippedTehsils += 1;
      continue;
    }
    await prisma.tehsil.delete({ where: { id: tehsil.id } });
    removedTehsils += 1;
  }

  const canonicalTehsils = await prisma.tehsil.findMany({
    where: { name: { in: CANONICAL_TEHSILS } },
    include: {
      villages: {
        include: { settlements: true },
      },
    },
  });

  let removedVillages = 0;
  let skippedVillages = 0;
  let removedSettlements = 0;
  let skippedSettlements = 0;

  for (const tehsil of canonicalTehsils) {
    const allowedVillages = new Set(LOCATION_DATA[tehsil.name] ?? []);

    for (const village of tehsil.villages) {
      if (!allowedVillages.has(village.name)) {
        const [packageLinkCount, surveyResponseCount] = await Promise.all([
          prisma.procurementPackageVillage.count({
            where: { villageId: village.id },
          }),
          prisma.surveyResponse.count({ where: { villageId: village.id } }),
        ]);
        if (packageLinkCount > 0 || surveyResponseCount > 0) {
          skippedVillages += 1;
          continue;
        }
        await prisma.village.delete({ where: { id: village.id } });
        removedVillages += 1;
        continue;
      }

      const allowedSettlements = new Set(SETTLEMENT_DATA[village.name] ?? []);
      for (const settlement of village.settlements) {
        if (!allowedSettlements.has(settlement.name)) {
          const surveyResponseCount = await prisma.surveyResponse.count({
            where: { settlementId: settlement.id },
          });
          if (surveyResponseCount > 0) {
            skippedSettlements += 1;
            continue;
          }
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
    removedTehsils > 0 ||
    removedVillages > 0 ||
    removedSettlements > 0 ||
    removedRaUsers.count > 0 ||
    skippedTehsils > 0 ||
    skippedVillages > 0 ||
    skippedSettlements > 0
  ) {
    console.log(
      `Pruned non-canonical data: ${removedTehsils} tehsils, ${removedVillages} villages, ${removedSettlements} settlements, ${removedRaUsers.count} RA users` +
        (skippedTehsils + skippedVillages + skippedSettlements > 0
          ? ` (skipped in-use: ${skippedTehsils} tehsils, ${skippedVillages} villages, ${skippedSettlements} settlements)`
          : ''),
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

  const tehsilCount = await prisma.tehsil.count({
    where: { name: { in: CANONICAL_TEHSILS } },
  });
  const villageCount = await prisma.village.count();
  const settlementCount = await prisma.settlement.count();
  const tehsilOfficeCount = await prisma.office.count({
    where: { type: OfficeType.TEHSIL_OFFICE },
  });

  console.log(
    `Geography seeded: ${tehsilCount} canonical tehsils, ${villageCount} villages, ${settlementCount} settlements, ${tehsilOfficeCount} tehsil offices`,
  );

  if (tehsilCount !== CANONICAL_TEHSILS.length) {
    throw new Error(
      `Expected ${CANONICAL_TEHSILS.length} canonical tehsils after seed, found ${tehsilCount}`,
    );
  }
}

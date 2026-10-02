// Run from the horse-farm project: node scripts/import-photo-names.cjs
const path = require('node:path');
const names = {
  instructor: ['אדם', 'מינה', 'גלאל'],
  horse: ['בלה', 'לילא', 'קאנדי', 'ורדה', 'לוקס', 'סארה', 'אוליוויה', 'סמירה', 'טוני', 'קאסטור', 'סאנדי', 'כרמל'],
  rider: ['מילא מוחמד סלאח', 'נור אגבאריה', 'אבראהים גמאל', 'עלי גמאל'],
};
const normalize = name => name.normalize('NFC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('he');
async function importNames(prisma) {
  return prisma.$transaction(async tx => {
    // Prevent another import or an ordinary insert from racing the duplicate check.
    await tx.$executeRaw`LOCK TABLE "public"."Farm", "public"."Instructor", "public"."Horse", "public"."Rider" IN SHARE ROW EXCLUSIVE MODE`;
    const farms = await tx.farm.findMany({ take: 2, select: { id: true, name: true } });
    if (farms.length !== 1) throw new Error('Import requires exactly one farm. No records were added.');
    const farm = farms[0], result = { farmName: farm.name, groups: {} };
    for (const [model, source] of Object.entries(names)) {
      const existing = await tx[model].findMany({ where: { farmId: farm.id }, select: { name: true } });
      const known = new Set(existing.map(row => normalize(row.name)));
      const added = [], skipped = [];
      for (const name of source) {
        const key = normalize(name);
        if (known.has(key)) { skipped.push(name); continue; }
        await tx[model].create({ data: { name, farmId: farm.id } });
        known.add(key); added.push(name);
      }
      result.groups[model] = { added, skipped };
    }
    return result;
  }, { maxWait: 10000, timeout: 60000 });
}
async function main() {
  // Use the project's existing .env/.env.local without printing credentials.
  const root = path.resolve(__dirname, '..');
  const { loadEnvConfig } = require('@next/env');
  loadEnvConfig(root, true);
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const result = await importNames(prisma);
    console.log('Import completed. Farm:', result.farmName);
    for (const [model, group] of Object.entries(result.groups)) {
      console.log(`${model}: added ${group.added.length}, skipped ${group.skipped.length}`);
      if (group.added.length) console.log('Added:', group.added.join(', '));
      if (group.skipped.length) console.log('Already present:', group.skipped.join(', '));
    }
  } catch (error) {
    console.error('Import failed. The transaction was rolled back.');
    if (error.message?.startsWith('Import requires')) console.error(error.message);
    else console.error('Check the database connection and Prisma setup. Error code:', error.code || 'unknown');
    process.exitCode = 1;
  } finally { await prisma.$disconnect(); }
}
module.exports = { importNames, names, normalize };
if (require.main === module) main().catch(() => {
  console.error('Could not start import. Run this script inside the installed horse-farm project.');
  process.exitCode = 1;
});

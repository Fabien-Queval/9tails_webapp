import { getDb } from './db/db';

const db = getDb();

const tables = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
    ORDER BY name
`).all() as { name: string }[];

console.log(`\n✅ ${tables.length} tables trouvées :`);
tables.forEach(t => console.log(`  - ${t.name}`));

if (tables.length !== 14) {
    console.error(`\n❌ Attendu 14, obtenu ${tables.length}`);
    process.exit(1);
}

console.log('\n🎉 BDD vivante — 14 tables.');
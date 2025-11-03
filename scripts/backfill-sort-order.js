/**
 * Backfill script to set initial sort_order values for artwork and tattoos
 * Based on created_at timestamp (oldest = 0, newest = higher number)
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'local.db');
const db = new Database(dbPath);

console.log('🔄 Starting sort_order backfill...\n');

try {
  // Backfill artwork sort_order
  console.log('📸 Processing artwork...');
  const artworks = db.prepare(`
    SELECT id FROM artwork 
    WHERE deleted_at IS NULL 
    ORDER BY created_at ASC
  `).all();
  
  const updateArtworkStmt = db.prepare('UPDATE artwork SET sort_order = ? WHERE id = ?');
  
  const artworkTransaction = db.transaction((items) => {
    items.forEach((artwork, index) => {
      updateArtworkStmt.run(index, artwork.id);
    });
  });
  
  artworkTransaction(artworks);
  console.log(`✅ Updated ${artworks.length} artwork records\n`);
  
  // Backfill tattoos sort_order
  console.log('🎨 Processing tattoos...');
  const tattoos = db.prepare(`
    SELECT id FROM tattoos 
    WHERE deleted_at IS NULL 
    ORDER BY created_at ASC
  `).all();
  
  const updateTattooStmt = db.prepare('UPDATE tattoos SET sort_order = ? WHERE id = ?');
  
  const tattooTransaction = db.transaction((items) => {
    items.forEach((tattoo, index) => {
      updateTattooStmt.run(index, tattoo.id);
    });
  });
  
  tattooTransaction(tattoos);
  console.log(`✅ Updated ${tattoos.length} tattoo records\n`);
  
  console.log('🎉 Backfill completed successfully!');
  
} catch (error) {
  console.error('❌ Error during backfill:', error);
  process.exit(1);
} finally {
  db.close();
}


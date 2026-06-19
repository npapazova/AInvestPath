const fs = require('fs');
const path = require('path');

async function main() {
  const dbPath = path.resolve(__dirname, '..', 'dev.db');
  const backupsDir = path.resolve(__dirname, '..', 'backups');

  try {
    await fs.promises.mkdir(backupsDir, { recursive: true });
  } catch (err) {
    console.error('Failed to ensure backups directory:', err);
    process.exit(1);
  }

  try {
    const exists = await fs.promises.stat(dbPath).then(() => true).catch(() => false);

    if (!exists) {
      console.warn('No dev.db found to back up at', dbPath);
      process.exit(0);
    }

    const now = new Date();
    // Windows filenames cannot contain ':' so use a safe timestamp
    const timestamp = now.toISOString().replace(/[:]/g, '-');
    const dest = path.join(backupsDir, `dev.db.${timestamp}`);

    await fs.promises.copyFile(dbPath, dest);
    console.log('Backup created:', dest);
  } catch (err) {
    console.error('Backup failed:', err);
    process.exit(1);
  }
}

main();

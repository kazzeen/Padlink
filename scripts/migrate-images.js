/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs/promises');
const path = require('path');

const prisma = new PrismaClient();

const UPLOADS_ROOT = path.join(process.cwd(), 'public', 'uploads');
const TARGET_DIRS = {
  property: path.join(UPLOADS_ROOT, 'properties'),
  profile: path.join(UPLOADS_ROOT, 'users', 'profiles'),
  roommate: path.join(UPLOADS_ROOT, 'users', 'roommates'),
};

async function ensureDirs() {
  await fs.mkdir(TARGET_DIRS.property, { recursive: true });
  await fs.mkdir(TARGET_DIRS.profile, { recursive: true });
  await fs.mkdir(TARGET_DIRS.roommate, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function migrateUsers() {
  console.log('Migrating users...');
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { avatar: { startsWith: '/uploads/' } },
        { image: { startsWith: '/uploads/' } }
      ]
    }
  });

  for (const user of users) {
    let updated = false;
    const updates = {};

    // Handle avatar
    if (user.avatar && user.avatar.startsWith('/uploads/') && !user.avatar.startsWith('/uploads/users/')) {
      const filename = path.basename(user.avatar);
      const oldPath = path.join(UPLOADS_ROOT, filename);
      const newPath = path.join(TARGET_DIRS.profile, filename);
      const newUrl = `/uploads/users/profiles/${filename}`;

      if (await fileExists(oldPath)) {
        await fs.rename(oldPath, newPath);
        updates.avatar = newUrl;
        updated = true;
        console.log(`Moved avatar for user ${user.id}: ${filename}`);
      } else if (await fileExists(newPath)) {
         updates.avatar = newUrl;
         updated = true;
      }
    }

    // Handle image
    if (user.image && user.image.startsWith('/uploads/') && !user.image.startsWith('/uploads/users/')) {
        const filename = path.basename(user.image);
        const oldPath = path.join(UPLOADS_ROOT, filename);
        const newPath = path.join(TARGET_DIRS.profile, filename);
        const newUrl = `/uploads/users/profiles/${filename}`;
  
        if (await fileExists(oldPath)) {
          await fs.rename(oldPath, newPath);
          updates.image = newUrl;
          updated = true;
          console.log(`Moved image for user ${user.id}: ${filename}`);
        } else if (await fileExists(newPath)) {
           updates.image = newUrl;
           updated = true;
        }
    }

    if (updated) {
      await prisma.user.update({
        where: { id: user.id },
        data: updates
      });
    }
  }
}

async function migrateListings() {
  console.log('Migrating listings...');
  const listings = await prisma.listing.findMany();

  for (const listing of listings) {
    let images = [];
    try {
      images = JSON.parse(listing.images);
    } catch {
      continue;
    }

    if (!Array.isArray(images)) continue;

    let updated = false;
    const newImages = [];

    for (const imgUrl of images) {
      if (imgUrl.startsWith('/uploads/') && !imgUrl.startsWith('/uploads/properties/')) {
        const filename = path.basename(imgUrl);
        const oldPath = path.join(UPLOADS_ROOT, filename);
        const newPath = path.join(TARGET_DIRS.property, filename);
        const newUrl = `/uploads/properties/${filename}`;

        if (await fileExists(oldPath)) {
          await fs.rename(oldPath, newPath);
          newImages.push(newUrl);
          updated = true;
          console.log(`Moved image for listing ${listing.id}: ${filename}`);
        } else if (await fileExists(newPath)) {
           newImages.push(newUrl);
           updated = true;
        } else {
           // Keep original if not found
           newImages.push(imgUrl);
        }
      } else {
        newImages.push(imgUrl);
      }
    }

    if (updated) {
      await prisma.listing.update({
        where: { id: listing.id },
        data: { images: JSON.stringify(newImages) }
      });
    }
  }
}

async function main() {
  try {
    await ensureDirs();
    await migrateUsers();
    await migrateListings();
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

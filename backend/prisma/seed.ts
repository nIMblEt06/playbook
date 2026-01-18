import { PrismaClient, TagCategory } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to create slug from name
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Official genre tags
const genreTags = [
  // Main genres
  'Rock',
  'Pop',
  'Hip-Hop',
  'R&B',
  'Jazz',
  'Classical',
  'Electronic',
  'Country',
  'Folk',
  'Blues',
  'Metal',
  'Punk',
  'Indie',
  'Alternative',
  'Soul',
  'Funk',
  'Reggae',
  'Latin',
  'World',
  'Ambient',
  // Subgenres
  'Indie Rock',
  'Indie Pop',
  'Dream Pop',
  'Shoegaze',
  'Post-Punk',
  'New Wave',
  'Synth-Pop',
  'Art Rock',
  'Progressive Rock',
  'Psychedelic Rock',
  'Garage Rock',
  'Grunge',
  'Emo',
  'Hardcore',
  'Post-Rock',
  'Math Rock',
  'Noise Rock',
  'Lo-Fi',
  'Trap',
  'Drill',
  'Boom Bap',
  'Cloud Rap',
  'House',
  'Techno',
  'Drum and Bass',
  'Dubstep',
  'IDM',
  'Downtempo',
  'Trip-Hop',
  'Neo-Soul',
  'Contemporary R&B',
  'Gospel',
  'Disco',
  'K-Pop',
  'J-Pop',
  'Afrobeats',
  'Dancehall',
  'Dub',
];

// Mood tags
const moodTags = [
  'Chill',
  'Energetic',
  'Melancholic',
  'Uplifting',
  'Dark',
  'Dreamy',
  'Aggressive',
  'Romantic',
  'Nostalgic',
  'Groovy',
  'Atmospheric',
  'Introspective',
  'Euphoric',
  'Haunting',
  'Playful',
];

// Era tags
const eraTags = [
  '60s',
  '70s',
  '80s',
  '90s',
  '2000s',
  '2010s',
  '2020s',
];

async function main() {
  console.log('Seeding official tags...');

  // Seed genre tags
  for (const name of genreTags) {
    await prisma.tag.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: {
        name,
        slug: slugify(name),
        category: TagCategory.genre,
        isOfficial: true,
      },
    });
  }
  console.log(`Seeded ${genreTags.length} genre tags`);

  // Seed mood tags
  for (const name of moodTags) {
    await prisma.tag.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: {
        name,
        slug: slugify(name),
        category: TagCategory.mood,
        isOfficial: true,
      },
    });
  }
  console.log(`Seeded ${moodTags.length} mood tags`);

  // Seed era tags
  for (const name of eraTags) {
    await prisma.tag.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: {
        name,
        slug: slugify(name),
        category: TagCategory.era,
        isOfficial: true,
      },
    });
  }
  console.log(`Seeded ${eraTags.length} era tags`);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

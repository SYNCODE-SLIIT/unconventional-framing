import { PrismaClient } from "@prisma/client";
import { frames } from "../lib/mock-data";

const prisma = new PrismaClient();

async function main() {
  for (const frame of frames) {
    const data = {
      movie: frame.movie,
      frameImage: frame.frameImage,
      timecode: frame.timecode,
      director: frame.director,
      dop: frame.dop,
      notes: frame.notes
    };
    await prisma.frame.upsert({
      where: { sequence: frame.sequence },
      create: { ...data, sequence: frame.sequence },
      update: data
    });
  }
  console.log(`Seeded ${frames.length} frames`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

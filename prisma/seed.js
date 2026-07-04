import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const demoPassword = 'password123';
  const hashedPassword = await bcrypt.hash(demoPassword, 10);

  // Create demo user (upsert by email)
  const user = await prisma.user.upsert({
    where: { email: 'sunkaraakshaya11@gmail.com' },
    update: {
      name: 'Sunkara Akshaya',
      password: hashedPassword,
      verified: true,
    },
    create: {
      email: 'sunkaraakshaya11@gmail.com',
      name: 'Sunkara Akshaya',
      password: hashedPassword,
      verified: true
    }
  });

  // Create sample jobs for the user
  const jobsData = [
    {
      title: 'Senior Frontend Engineer',
      description: 'Build rich interactive UI using React and TypeScript.',
      company: 'Nebula Systems',
      location: 'Remote'
    },
    {
      title: 'Full-Stack Developer',
      description: 'Work on API and frontend features in a fast-paced team.',
      company: 'TechVision Labs',
      location: 'Bengaluru, India'
    }
  ];

  for (const j of jobsData) {
    // Avoid duplicates by checking an existing job with same title and userId
    const exists = await prisma.job.findFirst({ where: { title: j.title, userId: user.id } });
    if (!exists) {
      await prisma.job.create({
        data: {
          title: j.title,
          description: j.description,
          company: j.company,
          location: j.location,
          userId: user.id
        }
      });
    }
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

async function main() {

    const hashedPassword = await argon2.hash('password');

  const user1 = await prisma.user.upsert({
    where: { email: 'user1@example.com' },
    update: { passwordHash: hashedPassword },
    create: {
      id: 'user1',
      name: 'User1',
      email: 'user1@example.com',
      passwordHash: hashedPassword,
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@example.com' },
    update: { passwordHash: hashedPassword },
    create: {
      id: 'user2',
      name: 'User2',
      email: 'user2@example.com',
      passwordHash: hashedPassword,
    },
  })

  const user3 = await prisma.user.upsert({
    where: { email: 'user3@example.com' },
    update: { passwordHash: hashedPassword },
    create: {
      id: 'user3',
      name: 'User3',
      email: 'user3@example.com',
      passwordHash: hashedPassword,
    },
  })

  console.log(user1,user2,user3);
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
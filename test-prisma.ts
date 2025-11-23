const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main(){
  const u = await prisma.user.create({
    data: { name: 'Test', email: 'test@example.com', passwordHash: 'fake' }
  });
  console.log('Created user', u);
}
main().catch(e => console.error(e)).finally(()=>prisma.$disconnect());

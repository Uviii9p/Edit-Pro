const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing Prisma Activity model...');
        // We don't necessarily need to create, just checking if the accessor exists
        if (prisma.activity) {
            console.log('✅ Activity model accessor exists on Prisma instance.');
        } else {
            console.log('❌ Activity model accessor NOT found.');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();

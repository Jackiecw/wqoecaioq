import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting category migration...');
    const products = await prisma.product.findMany({
        select: { category: true }
    });

    const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(c => c && c.trim() !== '')));
    console.log(`Found ${uniqueCategories.length} unique categories.`);

    for (const cat of uniqueCategories) {
        try {
            await prisma.productCategory.upsert({
                where: { name: cat },
                update: {},
                create: { name: cat, description: '自动迁移的分类' }
            });
            console.log(`Upserted category: ${cat}`);
        } catch (e) {
            console.error(`Failed to upsert category: ${cat}`, e);
        }
    }
    console.log('Migration completed.');
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

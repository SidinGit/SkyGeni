import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Read JSON files from the data directory
    const dataDir = path.join(__dirname, '../../../data');

    const accounts = JSON.parse(fs.readFileSync(path.join(dataDir, 'accounts.json'), 'utf-8'));
    const reps = JSON.parse(fs.readFileSync(path.join(dataDir, 'reps.json'), 'utf-8'));
    const deals = JSON.parse(fs.readFileSync(path.join(dataDir, 'deals.json'), 'utf-8'));
    const activities = JSON.parse(fs.readFileSync(path.join(dataDir, 'activities.json'), 'utf-8'));
    const targets = JSON.parse(fs.readFileSync(path.join(dataDir, 'targets.json'), 'utf-8'));

    // Clear existing data (in reverse order of dependencies)
    console.log('🗑️  Clearing existing data...');
    await prisma.activity.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.account.deleteMany();
    await prisma.rep.deleteMany();
    await prisma.target.deleteMany();

    // Seed Accounts
    console.log(`📊 Seeding ${accounts.length} accounts...`);
    await prisma.account.createMany({
        data: accounts,
    });

    // Seed Reps
    console.log(`👥 Seeding ${reps.length} reps...`);
    await prisma.rep.createMany({
        data: reps,
    });

    // Seed Targets
    console.log(`🎯 Seeding ${targets.length} targets...`);
    await prisma.target.createMany({
        data: targets,
    });

    // Seed Deals with data cleaning
    console.log(`💼 Seeding ${deals.length} deals...`);
    const cleanedDeals = deals.map((deal: any) => ({
        deal_id: deal.deal_id,
        account_id: deal.account_id,
        rep_id: deal.rep_id,
        stage: deal.stage,
        amount: deal.amount, // Keep null as-is, Prisma handles it
        created_at: new Date(deal.created_at),
        closed_at: deal.closed_at ? new Date(deal.closed_at) : null,
    }));
    await prisma.deal.createMany({
        data: cleanedDeals,
    });

    // Seed Activities
    console.log(`📞 Seeding ${activities.length} activities...`);
    const cleanedActivities = activities.map((activity: any) => ({
        activity_id: activity.activity_id,
        deal_id: activity.deal_id,
        type: activity.type,
        timestamp: new Date(activity.timestamp),
    }));
    await prisma.activity.createMany({
        data: cleanedActivities,
    });

    console.log('✅ Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

import 'dotenv/config';
import prisma from '../src/db/prisma.js';

/**
 * Seed script to populate database with 20 drivers
 * Run with: node prisma/seed.js
 */

const driverNames = [
  "Rajesh Kumar",
  "Amit Singh",
  "Vikram Patel",
  "Suresh Sharma",
  "Arjun Reddy",
  "Deepak Gupta",
  "Anil Verma",
  "Naveen Kumar",
  "Manoj Dwivedi",
  "Sanjay Nair",
  "Pradeep Iyer",
  "Karthik Ramalingam",
  "Harpreet Singh",
  "Mohammed Ali",
  "David Abraham",
  "Ravi Chandra",
  "Sandeep Rao",
  "Gautam Bhat",
  "Nikhil Sharma",
  "Ramesh Vada"
];

async function main() {
  try {
    console.log("🌱 Seeding database with drivers...");

    // Clear existing drivers
    const deletedDrivers = await prisma.driver.deleteMany();
    console.log(`🗑️  Cleared ${deletedDrivers.count} existing drivers`);

    const driversToCreate = driverNames.map((name) => {
      // Generate random license expiry dates (some expired, some valid, some expiring soon)
      const expiryDate = new Date();
      const randomDays = Math.floor(Math.random() * 730) - 100; // -100 to 630 days from today
      expiryDate.setDate(expiryDate.getDate() + randomDays);

      return {
        name,
        licenseExpiry: expiryDate,
        status: Math.random() > 0.85 ? "Suspended" : "Off Duty",
        safetyScore: Math.floor(Math.random() * 40) + 60 // 60-100 score
      };
    });

    const createdDrivers = await prisma.driver.createMany({
      data: driversToCreate
    });

    console.log(`✅ Successfully created ${createdDrivers.count} drivers`);

    // Display summary
    const allDrivers = await prisma.driver.findMany();
    const suspendedCount = allDrivers.filter((d) => d.status === "Suspended").length;
    const expiredCount = allDrivers.filter(
      (d) => new Date(d.licenseExpiry) < new Date()
    ).length;

    console.log("\n📊 Driver Summary:");
    console.log(`   Total Drivers: ${allDrivers.length}`);
    console.log(`   Suspended: ${suspendedCount}`);
    console.log(`   Expired Licenses: ${expiredCount}`);
    console.log(`   Available for Assignment: ${allDrivers.length - suspendedCount}`);

    console.log("\n✨ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

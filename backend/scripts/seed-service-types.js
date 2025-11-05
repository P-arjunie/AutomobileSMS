#!/usr/bin/env node
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import ServiceType from '../models/ServiceType.js';

dotenv.config();

const defaultTypes = [
  { slug: 'oil-change', name: 'Oil Change', description: 'Engine oil and filter replacement', estimatedDuration: 1, basePrice: 40 },
  { slug: 'brake-service', name: 'Brake Service', description: 'Pads/rotors inspection and replacement if needed', estimatedDuration: 2, basePrice: 150 },
  { slug: 'tire-rotation', name: 'Tire Rotation', description: 'Rotate tires for even wear', estimatedDuration: 1, basePrice: 30 },
  { slug: 'engine-diagnostic', name: 'Engine Diagnostic', description: 'Scan and identify engine issues', estimatedDuration: 2, basePrice: 100 },
  { slug: 'transmission-service', name: 'Transmission Service', description: 'Transmission fluid change and inspection', estimatedDuration: 3, basePrice: 300 },
  { slug: 'air-conditioning', name: 'Air Conditioning', description: 'AC system check and recharge', estimatedDuration: 2, basePrice: 180 },
  { slug: 'battery-service', name: 'Battery Service', description: 'Battery test and replacement', estimatedDuration: 1, basePrice: 80 },
  { slug: 'general-inspection', name: 'General Inspection', description: 'Comprehensive vehicle check-up', estimatedDuration: 1, basePrice: 50 },
  { slug: 'bodywork', name: 'Bodywork', description: 'Body repair work', estimatedDuration: 4, basePrice: 500 },
  { slug: 'painting', name: 'Painting', description: 'Body painting service', estimatedDuration: 4, basePrice: 600 },
  { slug: 'other', name: 'Other', description: 'Other service', estimatedDuration: 2, basePrice: 0 }
];

async function main() {
  await connectDB();
  try {
    const count = await ServiceType.countDocuments();
    if (count === 0) {
      await ServiceType.insertMany(defaultTypes);
      console.log('Seeded default service types.');
    } else {
      console.log('Service types already exist. No action taken.');
    }
  } catch (e) {
    console.error('Seeding failed:', e);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();

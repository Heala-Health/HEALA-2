import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@healthcare.com',
      password: adminPassword,
      profile: {
        create: {
          firstName: 'System',
          lastName: 'Administrator',
          role: 'ADMIN',
        }
      }
    }
  });

  // Create test hospital
  const hospital = await prisma.hospital.create({
    data: {
      name: 'General Hospital Lagos',
      address: '123 Main St, Lagos',
      phone: '+234-123-456-7890',
      email: 'contact@generalhospital.com',
      city: 'Lagos',
      state: 'Lagos',
      latitude: 6.5244,
      longitude: 3.3792,
    }
  });

  // Create test physician
  const physicianPassword = await bcrypt.hash('physician123', 12);
  const physician = await prisma.user.create({
    data: {
      email: 'physician@healthcare.com',
      password: physicianPassword,
      profile: {
        create: {
          firstName: 'Dr. John',
          lastName: 'Smith',
          role: 'PHYSICIAN',
          specialization: 'Cardiology',
          licenseNumber: 'MD123456',
          consultationRate: 50000,
          hospitalId: hospital.id,
        }
      }
    }
  });

  // Create test patient
  const patientPassword = await bcrypt.hash('patient123', 12);
  const patient = await prisma.user.create({
    data: {
      email: 'patient@healthcare.com',
      password: patientPassword,
      profile: {
        create: {
          firstName: 'Jane',
          lastName: 'Doe',
          role: 'PATIENT',
          phone: '+234-987-654-3210',
        }
      }
    }
  });

  console.log({ admin, hospital, physician, patient });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

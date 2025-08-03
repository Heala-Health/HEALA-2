# Database Schema - PostgreSQL Migration

This file contains the complete database schema migration from Supabase to PostgreSQL for the Node.js backend.

## 🗄️ Prisma Schema Configuration

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User Management
model User {
  id                String      @id @default(cuid())
  email             String      @unique
  password          String
  emailVerified     DateTime?
  emailVerificationToken String?
  resetPasswordToken String?
  resetPasswordExpires DateTime?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  profile           Profile?
  wallet            Wallet?
  appointments      Appointment[]
  emergencyRequests EmergencyRequest[]
  ambulanceRequests AmbulanceRequest[]
  conversations     Conversation[]
  messages          Message[]
  healthRecords     HealthRecord[]
  prescriptions     Prescription[]
  notifications     Notification[]
  documents         Document[]
  
  @@map("users")
}

model Profile {
  id                String    @id @default(cuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  firstName         String?
  lastName          String?
  phone             String?
  dateOfBirth       DateTime?
  gender            String?
  address           String?
  city              String?
  state             String?
  country           String?   @default("Nigeria")
  
  // Role-based fields
  role              UserRole  @default(PATIENT)
  
  // Physician-specific fields
  specialization    String?
  licenseNumber     String?
  yearsOfExperience Int?
  consultationRate  Decimal?  @default(0)
  isActive          Boolean   @default(true)
  hospitalId        String?
  hospital          Hospital? @relation(fields: [hospitalId], references: [id])
  
  // Patient-specific fields
  subscriptionPlan  String?   @default("basic")
  emergencyContacts EmergencyContact[]
  
  // Agent-specific fields
  agentAssignments  AgentAssignment[]
  assistedPatients  AgentAssistedPatient[]
  
  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@map("profiles")
}

enum UserRole {
  PATIENT
  PHYSICIAN
  AGENT
  HOSPITAL_ADMIN
  ADMIN
}

// Hospital Management
model Hospital {
  id                     String    @id @default(cuid())
  name                   String
  address                String?
  phone                  String?
  email                  String?
  city                   String?
  state                  String?
  latitude               Decimal?
  longitude              Decimal?
  isActive               Boolean   @default(true)
  verificationStatus     String    @default("pending")
  verificationDocuments  Json?     @default("[]")
  securitySettings       Json?     @default("{}")
  
  // Relationships
  profiles               Profile[]
  appointments           Appointment[]
  emergencyRequests      EmergencyRequest[]
  ambulanceRequests      AmbulanceRequest[]
  resources              HospitalResource[]
  patients               HospitalPatient[]
  waitlist               PatientWaitlist[]
  financialData          HospitalFinancialData[]
  complianceTracking     HospitalComplianceTracking[]
  analyticsData          AnalyticsData[]
  
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt
  
  @@map("hospitals")
}

// Appointment System
model Appointment {
  id                String           @id @default(cuid())
  patientId         String
  patient           User             @relation(fields: [patientId], references: [id])
  physicianId       String
  physician         Profile          @relation("PhysicianAppointments", fields: [physicianId], references: [id])
  hospitalId        String?
  hospital          Hospital?        @relation(fields: [hospitalId], references: [id])
  agentId           String?
  agent             Profile?         @relation("AgentAppointments", fields: [agentId], references: [id])
  
  appointmentDate   DateTime
  appointmentTime   String
  appointmentType   String           @default("consultation")
  consultationType  String           @default("in_person") // in_person, virtual
  status            String           @default("pending")   // pending, confirmed, cancelled, completed
  notes             String?
  meetingLink       String?
  
  // Virtual consultation
  consultationSession ConsultationSession?
  
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  
  @@map("appointments")
}

// Virtual Consultation System
model ConsultationSession {
  id                String               @id @default(cuid())
  appointmentId     String               @unique
  appointment       Appointment          @relation(fields: [appointmentId], references: [id])
  patientId         String
  physicianId       String
  sessionType       String               @default("video") // video, audio, text
  status            String               @default("scheduled") // scheduled, in_progress, completed, cancelled
  startedAt         DateTime?
  endedAt           DateTime?
  durationMinutes   Int?
  consultationRate  Decimal?
  paymentStatus     String               @default("pending")
  
  // WebRTC Room
  room              ConsultationRoom?
  
  createdAt         DateTime             @default(now())
  updatedAt         DateTime             @updatedAt
  
  @@map("consultation_sessions")
}

model ConsultationRoom {
  id                String               @id @default(cuid())
  sessionId         String               @unique
  session           ConsultationSession  @relation(fields: [sessionId], references: [id])
  roomToken         String               @unique
  roomStatus        String               @default("waiting") // waiting, active, completed
  patientJoined     Boolean              @default(false)
  physicianJoined   Boolean              @default(false)
  
  createdAt         DateTime             @default(now())
  updatedAt         DateTime             @updatedAt
  
  @@map("consultation_rooms")
}

// Chat System
model Conversation {
  id            String    @id @default(cuid())
  patientId     String
  patient       User      @relation(fields: [patientId], references: [id])
  physicianId   String?
  physician     Profile?  @relation("PhysicianConversations", fields: [physicianId], references: [id])
  type          String    @default("physician_consultation") // ai_diagnosis, physician_consultation, agent_support
  title         String?
  status        String?   @default("active")
  
  messages      Message[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@map("conversations")
}

model Message {
  id              String         @id @default(cuid())
  conversationId  String
  conversation    Conversation   @relation(fields: [conversationId], references: [id])
  senderId        String?
  sender          User?          @relation(fields: [senderId], references: [id])
  senderType      String         // patient, physician, ai_bot, agent
  messageType     String         @default("text") // text, image, file
  content         String
  metadata        Json?
  
  createdAt       DateTime       @default(now())
  
  @@map("messages")
}

// Emergency System
model EmergencyRequest {
  id                     String    @id @default(cuid())
  patientId              String
  patient                User      @relation(fields: [patientId], references: [id])
  emergencyType          String
  description            String?
  status                 String    @default("pending")
  severity               String    @default("medium")
  locationLatitude       Decimal?
  locationLongitude      Decimal?
  hospitalId             String?
  hospital               Hospital? @relation(fields: [hospitalId], references: [id])
  assignedPhysicianId    String?
  
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt
  
  @@map("emergency_requests")
}

model AmbulanceRequest {
  id                     String    @id @default(cuid())
  patientId              String
  patient                User      @relation(fields: [patientId], references: [id])
  emergencyType          String
  description            String?
  status                 String    @default("pending")
  pickupAddress          String
  pickupLatitude         Decimal?
  pickupLongitude        Decimal?
  destinationAddress     String?
  destinationLatitude    Decimal?
  destinationLongitude   Decimal?
  contactPhone           String
  ambulanceEta           Int?
  assignedHospitalId     String?
  assignedHospital       Hospital? @relation(fields: [assignedHospitalId], references: [id])
  
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt
  
  @@map("ambulance_requests")
}

// Financial System
model Wallet {
  id            String               @id @default(cuid())
  userId        String               @unique
  user          User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  balance       Decimal              @default(0)
  currency      String               @default("NGN")
  
  transactions  WalletTransaction[]
  
  createdAt     DateTime             @default(now())
  updatedAt     DateTime             @updatedAt
  
  @@map("wallets")
}

model WalletTransaction {
  id              String    @id @default(cuid())
  walletId        String
  wallet          Wallet    @relation(fields: [walletId], references: [id])
  transactionType String    // credit, debit
  amount          Decimal
  balanceAfter    Decimal
  description     String?
  referenceId     String?
  
  createdAt       DateTime  @default(now())
  
  @@map("wallet_transactions")
}

// Health Records
model HealthRecord {
  id            String    @id @default(cuid())
  patientId     String
  patient       User      @relation(fields: [patientId], references: [id])
  recordType    String
  title         String
  description   String?
  recordedDate  DateTime  @default(now())
  recordedBy    String?
  recordData    Json?     @default("{}")
  documentUrl   String?
  isSensitive   Boolean   @default(false)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@map("health_records")
}

// Additional models for Prescriptions, Emergency Contacts, etc.
model Prescription {
  id              String    @id @default(cuid())
  patientId       String
  patient         User      @relation(fields: [patientId], references: [id])
  physicianId     String
  medicationName  String
  dosage          String
  frequency       String
  duration        String
  instructions    String?
  status          String    @default("active")
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("prescriptions")
}

model EmergencyContact {
  id            String    @id @default(cuid())
  patientId     String
  patient       Profile   @relation(fields: [patientId], references: [id])
  name          String
  relationship  String
  phone         String
  email         String?
  address       String?
  isPrimary     Boolean   @default(false)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@map("emergency_contacts")
}

// Agent System
model AgentAssignment {
  id            String    @id @default(cuid())
  patientId     String
  agentId       String
  agent         Profile   @relation(fields: [agentId], references: [id])
  status        String    @default("active")
  assignedAt    DateTime  @default(now())
  completedAt   DateTime?
  notes         String?
  
  @@map("agent_assignments")
}

model AgentAssistedPatient {
  id                       String    @id @default(cuid())
  patientId                String
  agentId                  String
  agent                    Profile   @relation(fields: [agentId], references: [id])
  assistanceType           String
  description              String?
  status                   String    @default("active")
  notes                    String?
  lastInteractionAt        DateTime  @default(now())
  appointmentBookingCount  Int       @default(0)
  
  createdAt                DateTime  @default(now())
  updatedAt                DateTime  @updatedAt
  
  @@map("agent_assisted_patients")
}

// Hospital Management
model HospitalResource {
  id                   String    @id @default(cuid())
  hospitalId           String
  hospital             Hospital  @relation(fields: [hospitalId], references: [id])
  name                 String
  category             String
  totalQuantity        Int       @default(0)
  availableQuantity    Int       @default(0)
  inUseQuantity        Int       @default(0)
  maintenanceQuantity  Int       @default(0)
  status               String    @default("available")
  
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  
  @@map("hospital_resources")
}

model HospitalPatient {
  id                   String     @id @default(cuid())
  hospitalId           String
  hospital             Hospital   @relation(fields: [hospitalId], references: [id])
  patientId            String
  assignedPhysicianId  String?
  status               String     @default("active")
  admissionDate        DateTime   @default(now())
  dischargeDate        DateTime?
  roomNumber           String?
  notes                String?
  
  createdAt            DateTime   @default(now())
  updatedAt            DateTime   @updatedAt
  
  @@map("hospital_patients")
}

model PatientWaitlist {
  id                   String     @id @default(cuid())
  hospitalId           String
  hospital             Hospital   @relation(fields: [hospitalId], references: [id])
  patientId            String
  department           String
  reason               String
  priority             String     @default("medium")
  status               String     @default("waiting")
  estimatedWaitTime    Int?
  calledAt             DateTime?
  completedAt          DateTime?
  
  createdAt            DateTime   @default(now())
  updatedAt            DateTime   @updatedAt
  
  @@map("patient_waitlist")
}

// Financial Management
model HospitalFinancialData {
  id               String    @id @default(cuid())
  hospitalId       String
  hospital         Hospital  @relation(fields: [hospitalId], references: [id])
  transactionType  String
  category         String
  amount           Decimal
  currency         String    @default("NGN")
  description      String?
  transactionDate  DateTime  @default(now())
  fiscalMonth      String
  referenceId      String?
  metadata         Json?     @default("{}")
  
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  
  @@map("hospital_financial_data")
}

// Compliance and Analytics
model HospitalComplianceTracking {
  id                     String    @id @default(cuid())
  hospitalId             String
  hospital               Hospital  @relation(fields: [hospitalId], references: [id])
  complianceType         String
  status                 String    @default("compliant")
  score                  Int?      @default(100)
  lastAssessmentDate     DateTime  @default(now())
  nextAssessmentDue      DateTime?
  assessedBy             String?
  assessmentDetails      Json?     @default("{}")
  violations             Json?     @default("[]")
  correctiveActions      Json?     @default("[]")
  
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt
  
  @@map("hospital_compliance_tracking")
}

model AnalyticsData {
  id           String    @id @default(cuid())
  hospitalId   String?
  hospital     Hospital? @relation(fields: [hospitalId], references: [id])
  metricName   String
  metricValue  Decimal?
  metricDate   DateTime  @default(now())
  
  createdAt    DateTime  @default(now())
  
  @@map("analytics_data")
}

// Document Management
model Document {
  id                   String    @id @default(cuid())
  userId               String
  user                 User      @relation(fields: [userId], references: [id])
  documentName         String
  documentType         String
  documentUrl          String
  verificationStatus   String    @default("pending")
  verifiedBy           String?
  verifiedAt           DateTime?
  
  uploadDate           DateTime  @default(now())
  
  @@map("documents")
}

// Notifications
model Notification {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  type      String    @default("info")
  title     String
  message   String
  read      Boolean   @default(false)
  
  createdAt DateTime  @default(now())
  
  @@map("notifications")
}

// Audit and Logging
model AuditLog {
  id             String    @id @default(cuid())
  userId         String
  hospitalId     String?
  actionCategory String    @default("system_admin")
  actionType     String    @default("unknown")
  resourceType   String?
  resourceId     String?
  oldValues      Json?     @default("{}")
  newValues      Json?     @default("{}")
  impactLevel    String    @default("low")
  complianceRelevant Boolean @default(false)
  financialImpact Decimal?  @default(0)
  sessionId      String?
  ipAddress      String?
  userAgent      String?
  
  createdAt      DateTime  @default(now())
  
  @@map("audit_logs")
}
```

## 🗂️ Database Migration Commands

```bash
# Initialize Prisma
npx prisma init

# Generate migration
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Deploy to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# View database in browser
npx prisma studio
```

## 📊 Database Indexes

```sql
-- Performance indexes
CREATE INDEX idx_appointments_patient_date ON appointments(patient_id, appointment_date);
CREATE INDEX idx_appointments_physician_date ON appointments(physician_id, appointment_date);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);
CREATE INDEX idx_health_records_patient_date ON health_records(patient_id, recorded_date);
CREATE INDEX idx_wallet_transactions_wallet_created ON wallet_transactions(wallet_id, created_at);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX idx_emergency_requests_status_created ON emergency_requests(status, created_at);
CREATE INDEX idx_profiles_role_active ON profiles(role, is_active);
CREATE INDEX idx_hospitals_active_location ON hospitals(is_active, latitude, longitude);
```

## 🔧 Database Functions

```sql
-- Function to calculate distance between coordinates
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, lng1 DECIMAL, 
  lat2 DECIMAL, lng2 DECIMAL
) 
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    6371 * acos(
      cos(radians(lat1)) * 
      cos(radians(lat2)) * 
      cos(radians(lng2) - radians(lng1)) + 
      sin(radians(lat1)) * 
      sin(radians(lat2))
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check user role
CREATE OR REPLACE FUNCTION check_user_role(user_id TEXT, required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE user_id = user_id;
  RETURN user_role = required_role;
END;
$$ LANGUAGE plpgsql;
```

## 🌱 Database Seeding

```typescript
// prisma/seed.ts
import { PrismaClient, UserRole } from '@prisma/client';
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
          role: UserRole.ADMIN,
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
          role: UserRole.PHYSICIAN,
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
          role: UserRole.PATIENT,
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
```

## 🎯 Key Migration Points

1. **User Authentication**: Separate user table with password field
2. **Role Management**: Enum-based role system in profiles
3. **Relationships**: Proper foreign key relationships
4. **Timestamps**: Consistent created_at/updated_at fields
5. **JSON Fields**: Use for flexible data storage
6. **Decimal Fields**: For precise monetary values
7. **Indexing**: Strategic indexes for performance
8. **Constraints**: Data integrity and validation

## 📈 Performance Considerations

- Connection pooling with PgBouncer
- Read replicas for analytics queries
- Proper indexing strategy
- Query optimization
- Batch operations for bulk data
- Pagination for large datasets
- Caching frequently accessed data
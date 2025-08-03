# API Endpoints Documentation

Complete REST API specification for the Healthcare Platform Node.js backend.

## 🔐 Authentication Endpoints

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+234-123-456-7890",
  "role": "patient", // patient, physician, agent, hospital_admin
  "specialization": "Cardiology", // required for physicians
  "licenseNumber": "MD123456", // required for physicians
  "hospitalId": "hospital_id" // required for hospital staff
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "role": "patient"
      }
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

### POST /api/auth/login
Authenticate user and receive JWT tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### POST /api/auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

### POST /api/auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### POST /api/auth/reset-password
Reset password using reset token.

**Request Body:**
```json
{
  "token": "reset_token",
  "newPassword": "newpassword123"
}
```

### POST /api/auth/logout
Logout and invalidate tokens.

### POST /api/auth/verify-email
Verify email address using verification token.

### GET /api/auth/me
Get current authenticated user information.

## 👥 User Management Endpoints

### GET /api/users/profile
Get current user's profile.

### PUT /api/users/profile
Update current user's profile.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+234-123-456-7890",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "address": "123 Main St",
  "city": "Lagos",
  "state": "Lagos"
}
```

### PUT /api/users/change-password
Change user password.

### GET /api/users/physicians
Get list of available physicians.

**Query Parameters:**
- `specialization`: Filter by specialization
- `hospitalId`: Filter by hospital
- `latitude`: User latitude for distance calculation
- `longitude`: User longitude for distance calculation
- `radius`: Search radius in km (default: 50)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

### GET /api/users/physicians/:id
Get specific physician details.

### PUT /api/users/physician/availability
Update physician availability (physician only).

**Request Body:**
```json
{
  "availability": [
    {
      "dayOfWeek": 1, // Monday = 1, Sunday = 7
      "startTime": "09:00",
      "endTime": "17:00",
      "isActive": true
    }
  ]
}
```

### GET /api/users/patients
Get physician's assigned patients (physician only).

### POST /api/users/assign-physician
Request physician assignment (patient only).

### DELETE /api/users/delete-account
Delete user account.

## 📅 Appointment Endpoints

### POST /api/appointments
Book new appointment.

**Request Body:**
```json
{
  "physicianId": "physician_id",
  "appointmentDate": "2024-01-15",
  "appointmentTime": "10:00",
  "appointmentType": "consultation",
  "consultationType": "in_person", // in_person, virtual
  "notes": "Regular checkup",
  "hospitalId": "hospital_id"
}
```

### GET /api/appointments
Get user's appointments.

**Query Parameters:**
- `status`: Filter by status
- `startDate`: Filter from date
- `endDate`: Filter to date
- `type`: Filter by appointment type
- `page`: Page number
- `limit`: Items per page

### GET /api/appointments/:id
Get specific appointment details.

### PUT /api/appointments/:id
Update appointment.

### DELETE /api/appointments/:id
Cancel appointment.

### PUT /api/appointments/:id/approve
Approve appointment (physician only).

### PUT /api/appointments/:id/reject
Reject appointment (physician only).

### POST /api/appointments/:id/reschedule
Reschedule appointment.

**Request Body:**
```json
{
  "newDate": "2024-01-16",
  "newTime": "14:00",
  "reason": "Schedule conflict"
}
```

### GET /api/appointments/availability/:physicianId
Check physician availability.

**Query Parameters:**
- `date`: Specific date to check
- `startDate`: Range start date
- `endDate`: Range end date

### POST /api/appointments/:id/virtual-session
Create virtual consultation session.

### GET /api/appointments/statistics
Get appointment statistics (admin/hospital admin).

### GET /api/appointments/upcoming
Get upcoming appointments.

### GET /api/appointments/history
Get appointment history.

## 🎥 Virtual Consultation Endpoints

### GET /api/consultations/sessions
Get consultation sessions.

### GET /api/consultations/sessions/:id
Get specific consultation session.

### POST /api/consultations/sessions/:id/start
Start consultation session.

### POST /api/consultations/sessions/:id/end
End consultation session.

### GET /api/consultations/sessions/:id/room
Get WebRTC room details.

### POST /api/consultations/sessions/:id/join
Join consultation room.

### PUT /api/consultations/sessions/:id/status
Update session status.

### GET /api/consultations/active
Get active consultation sessions.

### POST /api/consultations/payment
Process consultation payment.

### GET /api/consultations/history
Get consultation history.

## 💬 Chat & Messaging Endpoints

### GET /api/chat/conversations
Get user's conversations.

### POST /api/chat/conversations
Create new conversation.

**Request Body:**
```json
{
  "physicianId": "physician_id", // optional for agent support
  "type": "physician_consultation", // physician_consultation, agent_support
  "title": "Medical Consultation"
}
```

### GET /api/chat/conversations/:id
Get conversation details.

### GET /api/chat/conversations/:id/messages
Get conversation messages.

### POST /api/chat/conversations/:id/messages
Send message to conversation.

**Request Body:**
```json
{
  "content": "Hello, I need medical advice",
  "messageType": "text" // text, image, file
}
```

### PUT /api/chat/conversations/:id/read
Mark conversation as read.

### DELETE /api/chat/conversations/:id
Delete conversation.

## 🚨 Emergency Endpoints

### POST /api/emergency/requests
Create emergency request.

**Request Body:**
```json
{
  "emergencyType": "medical_emergency",
  "description": "Chest pain and difficulty breathing",
  "severity": "high", // low, medium, high, critical
  "locationLatitude": 6.5244,
  "locationLongitude": 3.3792
}
```

### GET /api/emergency/requests
Get emergency requests.

### GET /api/emergency/requests/:id
Get specific emergency request.

### PUT /api/emergency/requests/:id
Update emergency request status.

### POST /api/emergency/ambulance
Request ambulance.

**Request Body:**
```json
{
  "emergencyType": "medical_emergency",
  "pickupAddress": "123 Main St, Lagos",
  "pickupLatitude": 6.5244,
  "pickupLongitude": 3.3792,
  "destinationAddress": "General Hospital Lagos",
  "contactPhone": "+234-123-456-7890",
  "description": "Patient unconscious"
}
```

### GET /api/emergency/ambulance/:id
Track ambulance request.

## 💰 Payment & Wallet Endpoints

### GET /api/payments/wallet
Get user's wallet information.

### POST /api/payments/wallet/fund
Fund wallet using Paystack.

**Request Body:**
```json
{
  "amount": 10000, // Amount in kobo (NGN)
  "currency": "NGN"
}
```

### GET /api/payments/wallet/transactions
Get wallet transactions.

### POST /api/payments/transfer
Transfer money to another wallet.

### POST /api/payments/consultation
Pay for consultation.

### POST /api/payments/paystack/verify
Verify Paystack payment.

### GET /api/payments/transactions
Get payment transactions.

### POST /api/payments/refund
Request refund.

### GET /api/payments/invoice/:id
Get payment invoice.

### POST /api/payments/webhook/paystack
Paystack webhook endpoint.

### GET /api/payments/statistics
Get payment statistics.

### POST /api/payments/withdraw
Withdraw from wallet.

## 🏥 Hospital Management Endpoints

### GET /api/hospitals
Get list of hospitals.

### GET /api/hospitals/:id
Get hospital details.

### PUT /api/hospitals/:id
Update hospital information (hospital admin only).

### GET /api/hospitals/:id/physicians
Get hospital physicians.

### POST /api/hospitals/:id/physicians
Add physician to hospital.

### GET /api/hospitals/:id/patients
Get hospital patients.

### POST /api/hospitals/:id/patients
Admit patient to hospital.

### GET /api/hospitals/:id/resources
Get hospital resources.

### POST /api/hospitals/:id/resources
Add hospital resource.

### PUT /api/hospitals/:id/resources/:resourceId
Update hospital resource.

### GET /api/hospitals/:id/waitlist
Get patient waitlist.

### POST /api/hospitals/:id/waitlist
Add patient to waitlist.

### PUT /api/hospitals/:id/waitlist/:waitlistId
Update waitlist entry.

### GET /api/hospitals/:id/analytics
Get hospital analytics.

### GET /api/hospitals/:id/financial
Get financial data.

### POST /api/hospitals/:id/financial
Add financial transaction.

### GET /api/hospitals/:id/compliance
Get compliance data.

### PUT /api/hospitals/:id/compliance
Update compliance status.

### GET /api/hospitals/:id/staff-schedule
Get staff schedule.

### POST /api/hospitals/:id/staff-schedule
Create staff schedule.

## 📋 Health Records Endpoints

### GET /api/health-records
Get patient's health records.

### POST /api/health-records
Create new health record.

**Request Body:**
```json
{
  "recordType": "lab_result",
  "title": "Blood Test Results",
  "description": "Complete blood count",
  "recordedDate": "2024-01-15",
  "recordData": {
    "hemoglobin": "14.5 g/dL",
    "whiteBloodCells": "7000/μL"
  },
  "isSensitive": false
}
```

### GET /api/health-records/:id
Get specific health record.

### PUT /api/health-records/:id
Update health record (physician only).

### DELETE /api/health-records/:id
Delete health record.

### POST /api/health-records/:id/share
Share health record with physician.

### GET /api/health-records/shared
Get records shared with current physician.

## 💊 Prescription Endpoints

### GET /api/prescriptions
Get patient's prescriptions.

### POST /api/prescriptions
Create new prescription (physician only).

**Request Body:**
```json
{
  "patientId": "patient_id",
  "medicationName": "Amoxicillin",
  "dosage": "500mg",
  "frequency": "3 times daily",
  "duration": "7 days",
  "instructions": "Take with food"
}
```

### GET /api/prescriptions/:id
Get specific prescription.

### PUT /api/prescriptions/:id
Update prescription status.

### GET /api/prescriptions/active
Get active prescriptions.

### GET /api/prescriptions/history
Get prescription history.

## 📄 Document Management Endpoints

### POST /api/documents/upload
Upload document.

**Request:** Multipart form data
- `file`: Document file
- `documentType`: Type of document
- `description`: Document description

### GET /api/documents
Get user's documents.

### GET /api/documents/:id
Get specific document.

### DELETE /api/documents/:id
Delete document.

### PUT /api/documents/:id/verify
Verify document (admin only).

### GET /api/documents/download/:id
Download document.

## 🔔 Notification Endpoints

### GET /api/notifications
Get user's notifications.

### PUT /api/notifications/:id/read
Mark notification as read.

### PUT /api/notifications/read-all
Mark all notifications as read.

### DELETE /api/notifications/:id
Delete notification.

### POST /api/notifications/push-token
Register push notification token.

## 🎯 Agent Assistance Endpoints

### GET /api/agent/patients
Get agent's assisted patients.

### POST /api/agent/patients
Add patient to assistance list.

### GET /api/agent/conversations
Get agent support conversations.

### POST /api/agent/book-appointment
Book appointment for patient.

### GET /api/agent/assignments
Get agent assignments.

## 📊 Analytics & Reporting Endpoints

### GET /api/analytics/dashboard
Get dashboard analytics.

### GET /api/analytics/appointments
Get appointment analytics.

### GET /api/analytics/revenue
Get revenue analytics.

### GET /api/analytics/users
Get user analytics.

### GET /api/analytics/hospitals
Get hospital analytics.

### POST /api/analytics/custom-report
Generate custom report.

## ⚙️ Admin Endpoints

### GET /api/admin/users
Get all users (admin only).

### PUT /api/admin/users/:id/status
Update user status.

### GET /api/admin/hospitals
Get all hospitals.

### PUT /api/admin/hospitals/:id/verify
Verify hospital.

### GET /api/admin/audit-logs
Get audit logs.

### GET /api/admin/system-health
Get system health status.

### GET /api/admin/statistics
Get system statistics.

## 🔧 Utility Endpoints

### GET /api/health
Health check endpoint.

### GET /api/version
Get API version information.

### POST /api/support/contact
Send support message.

### GET /api/locations/nearby-hospitals
Get nearby hospitals.

**Query Parameters:**
- `latitude`: User latitude
- `longitude`: User longitude
- `radius`: Search radius in km

### GET /api/locations/nearby-physicians
Get nearby physicians.

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

## 🔐 Authentication

Most endpoints require authentication via JWT token:

```
Authorization: Bearer <jwt_token>
```

## 📋 Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 10 requests per 15 minutes per IP
- **File Upload**: 10 requests per hour per user
- **Payment**: 20 requests per hour per user

## 🎯 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error
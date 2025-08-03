# Integration Guide: Connecting Node.js Backend to Supabase, AWS, and Paystack

This guide provides comprehensive instructions on how to link the Node.js backend for the healthcare platform with external services like Supabase (for the database), AWS (for file storage), and Paystack (for payments). It also includes instructions on how to dockerize the application for easy deployment and scaling.

## 🚀 Architecture Overview

The backend is designed to be modular and scalable, integrating with best-in-class services for different functionalities:

-   **Application Logic**: A Node.js server running Express.js and TypeScript.
-   **Database**: A PostgreSQL database hosted on Supabase.
-   **File Storage**: Secure file and image storage using AWS S3.
-   **Payments**: A robust payment system powered by Paystack.
-   **Real-time Communication**: A Socket.IO server for chat, notifications, and WebRTC signaling.

## ✅ Prerequisites

Before you begin, ensure you have the following:

-   A [Supabase](https://supabase.com/) account with a new project created.
-   An [AWS](https://aws.amazon.com/) account with an S3 bucket and IAM credentials.
-   A [Paystack](https://paystack.com/) account with API keys.
-   [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed on your local machine.
-   [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on your local machine.

## ⚙️ Environment Configuration

Create a `.env` file in the root of the `healthcare-backend` project with the following variables. This file will store all the necessary credentials and configuration for the external services.

### 1. Supabase Database Configuration

1.  Navigate to your Supabase project's dashboard.
2.  Go to **Project Settings** > **Database**.
3.  Under **Connection string**, find the URI. It will look something like this: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres`.
4.  Copy this URI and add it to your `.env` file:

```env
# Supabase Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres"
```

### 2. AWS S3 Configuration

1.  In your AWS account, create an S3 bucket for storing documents and another for images.
2.  Create an IAM user with programmatic access and attach a policy that grants permissions to read, write, and delete objects in your S3 buckets.
3.  Note down the **Access Key ID** and **Secret Access Key** for the IAM user.
4.  Add the following to your `.env` file:

```env
# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_DOCUMENTS_BUCKET="your-s3-documents-bucket-name"
AWS_IMAGES_BUCKET="your-s3-images-bucket-name"
AWS_REGION="your-aws-region"
```

### 3. Paystack Payment Configuration

1.  In your Paystack dashboard, go to **Settings** > **API Keys & Webhooks**.
2.  Copy your **Secret Key** and **Public Key**.
3.  Set up a webhook and get the **Webhook Secret**.
4.  Add the following to your `.env` file:

```env
# Paystack
PAYSTACK_SECRET_KEY="your-production-paystack-secret-key"
PAYSTACK_PUBLIC_KEY="your-production-paystack-public-key"
PAYSTACK_WEBHOOK_SECRET="your-paystack-webhook-secret"
```

### 4. JWT and Server Configuration

Add the following to your `.env` file for JWT and server configuration:

```env
# JWT
JWT_SECRET="a-very-strong-and-long-random-string"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="another-very-strong-and-long-random-string"

# Server
NODE_ENV=development
PORT=3000
CLIENT_ORIGIN="http://localhost:3001" # Your frontend URL
```

## 🐳 Dockerizing the Application

To ensure the application runs consistently across different environments, we will use Docker.

### 1. Create a `Dockerfile`

Create a file named `Dockerfile` in the `healthcare-backend` directory with the following content:

```dockerfile
# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application's source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define the command to run the app
CMD [ "node", "dist/index.js" ]
```

### 2. Create a `docker-compose.yml`

Create a file named `docker-compose.yml` in the `healthcare-backend` directory with the following content:

```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    volumes:
      - .:/usr/src/app
      - /usr/src/app/node_modules
```

### 3. Running with Docker

1.  Make sure your `.env` file is correctly configured.
2.  Open a terminal in the `healthcare-backend` directory and run the following command:

```bash
docker compose up --build
```

This will build the Docker image and start the container. The backend will be accessible at `http://localhost:3000`.

## 🧪 Testing the Communication

With the application running (either locally with `npm run dev` or with Docker), you can test the communication between the different services:

-   **Database**: Register a new user through the `/api/auth/register` endpoint. If the user is created successfully, you should see a new entry in the `users` table in your Supabase database.
-   **File Storage**: Use the `/api/documents/upload` endpoint to upload a file. The file should appear in your AWS S3 bucket.
-   **Payments**: Use the `/api/payments/wallet/fund` endpoint to initiate a payment. You should be redirected to a Paystack payment page.
-   **Real-time**: Connect to the Socket.IO server and test the chat functionality. Messages should be sent and received in real-time.

This setup ensures that all components of the backend are properly integrated and communicating with each other, providing a solid foundation for the healthcare platform.

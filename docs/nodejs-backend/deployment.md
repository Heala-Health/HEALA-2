# Production Deployment Guide

This document provides a comprehensive guide for deploying the Node.js backend for the healthcare platform to a production environment.

## 🚀 Deployment Architecture

A typical production setup would look like this:

```
┌──────────────────┐     ┌──────────────────┐     ┌────────────────┐
│   Load Balancer  │────►│  Node.js Server  │────►│   PostgreSQL   │
│ (e.g., Nginx)    │     │  (PM2/Docker)    │     │ (Managed DB)   │
└─────────┬────────┘     └─────────┬────────┘     └────────────────┘
          │                        │
          │                        │     ┌────────────────┐
          │                        ├────►│     Redis      │
          │                        │     │ (for Caching)  │
          │                        │     └────────────────┘
          │                        │
          │                        │     ┌────────────────┐
          │                        └────►│      AWS S3    │
          │                              │ (File Storage) │
          │                              └────────────────┘
          │
┌─────────▼────────┐
│   Client Apps    │
│ (Web & Mobile)   │
└──────────────────┘
```

## ✅ Prerequisites

Before you begin, ensure you have the following:

- A cloud provider account (e.g., AWS, DigitalOcean, Heroku).
- A registered domain name.
- A managed PostgreSQL database.
- An AWS S3 bucket for file storage.
- Node.js and npm installed on your local machine.
- `git` installed on your local machine.
- A Paystack account for payment processing.

## ⚙️ Environment Configuration

Create a `.env` file in the root of your project with the following production-ready variables:

```env
# Server Configuration
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL="your-production-database-url"

# JWT
JWT_SECRET="a-very-strong-and-long-random-string"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="another-very-strong-and-long-random-string"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_DOCUMENTS_BUCKET="your-s3-documents-bucket-name"
AWS_IMAGES_BUCKET="your-s3-images-bucket-name"
AWS_REGION="your-aws-region"

# Paystack
PAYSTACK_SECRET_KEY="your-production-paystack-secret-key"
PAYSTACK_PUBLIC_KEY="your-production-paystack-public-key"
PAYSTACK_WEBHOOK_SECRET="your-paystack-webhook-secret"

# CORS
CLIENT_ORIGIN="https://your-frontend-domain.com"

# Redis (Optional)
REDIS_URL="redis://your-redis-host:6379"
```

## 📦 Deployment Steps

### 1. Build the Project

First, compile the TypeScript code to JavaScript:

```bash
npm run build
```

This will create a `dist` directory with the compiled JavaScript files.

### 2. Set Up a Process Manager

We recommend using **PM2** to manage the Node.js process in production.

```bash
# Install PM2 globally
npm install pm2 -g

# Start the application
pm2 start dist/app.js --name "healthcare-backend"
```

### 3. Configure a Web Server (Nginx)

Set up Nginx as a reverse proxy to forward requests to your Node.js application.

Create a new Nginx configuration file at `/etc/nginx/sites-available/your-domain.com`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Set Up SSL with Let's Encrypt

Secure your application with a free SSL certificate from Let's Encrypt.

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 🔄 Continuous Integration/Deployment (CI/CD)

Automate your deployment process using GitHub Actions. Create a workflow file at `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v2

    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm install

    - name: Build project
      run: npm run build

    - name: Deploy to server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SSH_HOST }}
        username: ${{ secrets.SSH_USERNAME }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        script: |
          cd /path/to/your/project
          git pull origin main
          npm install
          npm run build
          pm2 restart healthcare-backend
```

## 📊 Monitoring and Logging

- **Health Checks**: Implement a `/health` endpoint that checks the status of the database and other critical services.
- **Logging**: Use a production-ready logger like **Winston** or **Pino** to log to files or a logging service (e.g., Logstash, Datadog).
- **Performance Monitoring**: Use a tool like **New Relic** or **Datadog APM** to monitor application performance.
- **Error Tracking**: Integrate an error tracking service like **Sentry** or **Bugsnag**.

## 🔒 Security Best Practices

- **Firewall**: Configure a firewall (e.g., `ufw`) to only allow traffic on necessary ports (80, 443).
- **HTTPS**: Ensure all traffic is served over HTTPS.
- **Dependency Updates**: Regularly update dependencies to patch security vulnerabilities.
- **Rate Limiting**: Implement rate limiting on sensitive endpoints to prevent abuse.
- **Helmet**: Use the `helmet` middleware to set various security-related HTTP headers.
- **Environment Variables**: Never commit your `.env` file to version control. Use a secrets management system for production keys.

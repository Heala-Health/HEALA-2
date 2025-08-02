# HEALA Node.js Backend

This is the Node.js backend for the HEALA application.

## Prerequisites

- Node.js
- npm

## Installation

1.  Clone the repository.
2.  Navigate to the `nodejs-backend` directory:
    ```bash
    cd nodejs-backend
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```
4.  Create a `.env` file in the `nodejs-backend` directory and add the following environment variables:
    ```
    # Supabase
   SUPABASE_URL= https://hzznoxctqybcberrkgjt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6em5veGN0cXliY2JlcnJrZ2p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNzc2OTMsImV4cCI6MjA2MzY1MzY5M30.CRpYAbPa00yuEsSYtzIDujX1xcCpJAOk2VYtxh9msJ0

    # Deepseek
    DEEPSEEK_API_KEY=your_deepseek_api_key

    # Paystack
    PAYSTACK_SECRET_KEY=sk_live_4ec03224c55b3e31eb3721219cbce4b000197d6d

    # Server
    PORT=3001
    ```
    Replace the placeholder values with your actual credentials.

## Running the application

```bash
npm start
```

The application will be available at `http://localhost:3001`.

## API Endpoints

-   `POST /api/chat`: Chat with the AI assistant.
-   `POST /api/payment/initialize`: Initialize a Paystack payment.

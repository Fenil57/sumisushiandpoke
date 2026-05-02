# Sumi Sushi and Poke

Welcome to the Sumi Sushi and Poke digital platform. This repository contains the source code for the restaurant's public-facing website, online ordering system, and administrative dashboard.

## 🚀 Key Features

*   **Public Website:** A beautifully designed landing page showcasing the menu, location, and restaurant information.
*   **Online Ordering System:** A complete e-commerce flow allowing customers to browse the menu, add items to a cart, and place orders. Includes location-based delivery validation.
*   **Admin Dashboard:** A secure, authenticated portal for restaurant staff to manage the menu, review incoming orders, and configure site settings.
*   **Payment Integration:** Built-in support for Flatpay (currently configured with a manual checkout fallback option).
*   **Email Notifications:** Automated order confirmations and updates using NodeMailer.

## 🛠 Tech Stack

*   **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion
*   **Backend:** Node.js, Express
*   **Database & Auth:** Firebase (Firestore, Authentication, Storage)

## 📚 Documentation

For detailed guides and requirements, please refer to the following documents:

*   [**Client Project Guide**](./CLIENT_PROJECT_GUIDE.md): Comprehensive guide for handing over the project, including Firebase setup, Flatpay configuration, and deployment instructions.
*   [**Backend Requirements**](./BACKEND_REQUIREMENTS.md): Technical notes detailing backend architecture, API endpoints, and security considerations.

## 💻 Local Development Setup

Follow these steps to run the application locally on your machine.

### Prerequisites
*   Node.js (v18 or higher recommended)
*   npm (comes with Node.js)
*   A Firebase project (for database and authentication)

### 1. Installation

Clone the repository and install the dependencies:

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file to create your local configuration:

```bash
cp .env.example .env
```

Open the `.env` file and populate it with your actual credentials. For a detailed explanation of each variable, refer to the comments within the `.env.example` file and the `CLIENT_PROJECT_GUIDE.md`.

**Key Environment Flags:**
*   `VITE_ENABLE_MENU_IMAGE_UPLOAD`: Set to `"true"` to enable image uploads in the admin panel (requires Firebase Storage).
*   `VITE_ENABLE_ONLINE_PAYMENT`: Set to `"true"` to enable the Flatpay checkout integration, or `"false"` for manual unpaid orders.
*   `VITE_API_BASE_URL`: The URL for the backend API (e.g., `http://localhost:3001` for local development).
*   `NLS_API_KEY`: Required for Finnish delivery-address validation and distance checks.

### 3. Running the Development Server

Start both the React frontend and the Express backend concurrently:

```bash
npm run dev:all
```

The application will be available at:
*   **Frontend:** `http://localhost:3000`
*   **API Server:** `http://localhost:3001`

## 📦 Deployment

The project is structured to be deployed easily on platforms like Vercel, Netlify, or Firebase Hosting.

*   The **Frontend** is built using Vite (`npm run build`) and outputs to the `dist` directory.
*   The **Backend** is built using Express and is configured to run as serverless functions (see `api/index.ts` and `vercel.json` for Vercel deployment).

When deploying, ensure all environment variables from your `.env` file are securely added to your hosting provider's environment configuration.

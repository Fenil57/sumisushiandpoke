# Sumi Sushi and Poke - Backend Requirements Document

## Project Overview
We are building a digital ordering system for a restaurant in Kaarina, Finland called "Sumi Sushi and Poke". 
The frontend is built with React (Vite), Tailwind CSS, and motion/react for animations.
The goal is to have a $0/month infrastructure cost to start, scaling only when revenue scales.

## Tech Stack Decisions
*   **Frontend:** React (Vite) + Tailwind CSS (Handled by Gemini)
*   **Backend/Database:** Firebase (Firestore + Auth) - *To be handled by Claude*
*   **Payments:** Flatpay hosted checkout with secure server-side verification - now implemented in code

## Core Features Required from Backend

### 1. Database Schema (Firestore)
We need a NoSQL database structure to handle the following:

*   **`menu_items` collection:**
    *   Needs to store items parsed from the restaurant's Instagram data (Sushi, Woks, Finger Foods, Drinks).
    *   Fields: `id`, `name`, `description`, `price` (in Euros), `category`, `image_url`, `is_available`.
*   **`orders` collection:**
    *   Needs to store customer orders.
    *   Fields: `order_id`, `customer_info` (name, phone, email), `items` (array of menu items + quantities), `total_amount`, `status` (pending, preparing, ready, completed, cancelled), `payment_status` (paid, unpaid), `created_at`.
*   **`users` collection (Optional/Admin):**
    *   For restaurant staff to log in and manage orders.
    *   Fields: `uid`, `email`, `role` (admin, staff).

### 2. Authentication (Firebase Auth)
*   We need a secure way for the restaurant owner/staff to log into a hidden `/admin` dashboard.
*   Email/Password authentication is sufficient for staff.
*   Customers do *not* need to create accounts to place an order (Guest checkout is preferred for speed).

### 3. Payment Integration (Flatpay)
*   We need a secure backend environment (for example the included Express server) to hold Flatpay credentials and Firebase Admin credentials.
*   **Crucial Requirement:** The website must not trust the browser for final paid-order creation.
*   Flow: Frontend sends cart + customer details -> Backend recalculates totals from live menu/settings -> Backend creates Flatpay hosted checkout session -> Customer pays on Flatpay -> Backend verifies payment -> Backend creates the final order -> Webhook acts as backup reconciliation.

### 4. Real-time Order Updates
*   The `/admin` dashboard needs to listen to the `orders` collection in real-time (using Firestore `onSnapshot`) so the kitchen sees new orders instantly without refreshing the page.

## Data Source
The menu data has been scraped from the restaurant's Instagram and is available in JSON format. The frontend will need an API or direct Firestore access to fetch this data to render the menu.

## Next Steps for Claude
1.  Design the exact Firestore Security Rules to ensure customers can only write orders, but only authenticated admins can read/update all orders.
2.  Provide the Node.js/Express (or Firebase Cloud Function) code required to securely initialize Flatpay hosted checkout, verify payment status, and create final orders only after payment verification.
3.  Provide the Firebase initialization code and the specific Firestore queries needed for the frontend to:
    *   Fetch the active menu.
    *   Submit a new order.
    *   Listen for real-time order updates (for the admin panel).

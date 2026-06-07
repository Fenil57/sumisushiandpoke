# Client Project Guide

## What This Project Is

This project is a restaurant website for **Sumi Sushi and Poke**.

It has 3 main parts:

1. A public website where customers can view the brand and menu.
2. An online ordering page where customers can place and pay for orders.
3. A private staff dashboard where the restaurant can manage orders and menu items.

This guide is written in plain language, so you do **not** need technical knowledge to understand it.

---

## What Your Customers See

### 1. Home Page

The home page is the visual front of the restaurant brand. It includes:

- A strong landing section with video-style motion
- Featured menu presentation
- Restaurant storytelling sections
- Testimonials
- Delivery/workflow section
- Contact information and opening-hours section in the footer

### 2. Online Ordering Page

Customers can:

- Browse menu items by category
- Add items to their cart
- Choose **delivery** or **pickup**
- Enter their contact details
- Pay securely online
- Receive an on-screen order confirmation

The website also supports **English** and **Finnish**.

---

## What Your Staff See

There is a hidden admin area for staff.

### Admin Login

Staff log in through a private page:

`/admin/login`

### Admin Dashboard

After logging in, staff can use 3 sections:

#### 1. Orders

Staff can:

- See new orders in real time
- View customer name, phone, email, items, and total
- Move orders through stages:
  - New Order
  - Preparing
  - Ready
  - Completed
- Cancel an order if needed

This is designed so the kitchen or front desk can keep track of orders without refreshing the page.

#### 2. Menu

Staff can:

- Add a new item
- Edit an existing item
- Change price
- Change description
- Change image by pasting an image URL
- Add tags such as "Popular" or "Spicy"
- Hide an item from customers without deleting it
- Delete an item if needed

This means the restaurant can keep the live menu updated without changing code.

#### 3. Settings

There is also a settings area intended for:

- Restaurant name
- Short subtitle / welcome text
- Phone number
- Email address
- Address

These details are used in visible parts of the website such as the navigation, footer, and transitions.

---

## How Orders Work

Here is the simple order flow:

1. The customer chooses food on the website.
2. The customer selects delivery or pickup.
3. The customer enters contact details.
4. The payment is processed online.
5. The payment is verified securely by the server.
6. After the payment is verified, the order is saved.
7. The order appears inside the admin dashboard.
8. Staff update the order status as they prepare it.

If email notifications are connected, the restaurant can also receive an email when a new order comes in.

---

## How Payments Work

Payments are handled through **Stripe** using a hosted secure checkout page.

Stripe is one of the world's largest and most trusted online payment companies. It supports:

- **Credit and debit cards** (Visa, Mastercard, American Express)
- **MobilePay** (the most popular mobile payment app in Finland)
- **Apple Pay** and **Google Pay**
- **Direct bank payments** (Finnish online banking)

The current setup is designed so that:

- The customer is redirected to Stripe's secure payment page
- Card details stay with the payment provider, not inside this website
- The server verifies the payment before the restaurant order is created
- A backup webhook also helps ensure paid orders are not lost if the customer closes the page after payment

### Step-by-Step: How to Set Up Stripe (Non-Technical Guide)

Follow these steps carefully. You do not need any coding knowledge.

#### Step 1: Create a Stripe Account

1. Open your web browser and go to **https://stripe.com**
2. Click **"Start now"** (or **"Create account"**)
3. Enter your **email address** and choose a **password**
4. Follow the on-screen steps to verify your email
5. Stripe will ask you to fill in your **business details** (restaurant name, address, bank account for payouts). Complete all of this.

> **Note:** Stripe may take 1–2 business days to verify your account before you can accept real payments. You can still test everything immediately.

#### Step 2: Find Your API Keys

API keys are like passwords that let your website talk to Stripe securely.

1. Log into your Stripe account at **https://dashboard.stripe.com**
2. In the left sidebar, click **"Developers"**
3. Click **"API keys"**
4. You will see two keys:
   - **Publishable key** — starts with `pk_test_...` or `pk_live_...`. **Ignore this one completely.** It is only used by websites that build their own payment form. Our website redirects to Stripe's own secure page instead, so we do not need it.
   - **Secret key** — starts with `sk_test_...` or `sk_live_...`. **This is the only key you need.** It lets the website server create payment sessions securely.
5. Click **"Reveal test key"** to see the full secret key
6. **Copy** the secret key — you will paste it later

> **Important:** Never share your secret key with anyone publicly. Treat it like a bank password.

#### Step 3: Understand Test Mode vs Live Mode

Stripe gives you **two separate sets of keys** automatically:

| Mode | Key starts with | What it does |
|------|----------------|--------------|
| **Test Mode** | `sk_test_...` | For testing. No real money is charged. Use fake card numbers. |
| **Live Mode** | `sk_live_...` | For real customers. Real money is charged to real cards. |

- At the top of your Stripe Dashboard, you will see a toggle or switch that says **"Test mode"**
- When the toggle is **ON** (orange), you see test keys
- When the toggle is **OFF**, you see live keys

**Start with Test Mode** to make sure everything works. Switch to Live Mode only when you are ready to accept real payments.

**Test card number for testing:** Use `4242 4242 4242 4242` with any future expiry date and any 3-digit CVC.

#### Step 4: Set Up the Webhook

A webhook is an automatic notification from Stripe to your website. It makes sure that even if a customer closes their browser after paying, the order still gets saved.

1. In your Stripe Dashboard, click **"Developers"** in the left sidebar
2. Click **"Webhooks"**
3. Click the **"Add endpoint"** button
4. In the **"Endpoint URL"** field, type exactly:
   ```
   https://sumisushiandpoke.fi/api/stripe/webhook
   ```
5. Under **"Select events to listen to"**, click **"+ Select events"**
6. Search for **`checkout.session.completed`** and check the box next to it
7. Click **"Add events"**
8. Click **"Add endpoint"**
9. After the endpoint is created, you will see a section called **"Signing secret"**
10. Click **"Reveal"** to see it — it starts with `whsec_...`
11. **Copy** this signing secret — you will paste it later

> **Note:** If you are testing, make sure you are in **Test Mode** when creating the webhook. You will need to create a separate webhook for Live Mode later.

#### Step 5: Give the Keys to Your Developer

Send the following two values to your developer (or paste them into the website's settings file yourself if you have access):

1. **STRIPE_SECRET_KEY** — the secret key from Step 2 (starts with `sk_test_...` or `sk_live_...`)
2. **STRIPE_WEBHOOK_SECRET** — the signing secret from Step 4 (starts with `whsec_...`)

Your developer will paste these into the website's configuration file. That is all that is needed to activate payments.

#### Step 6: Enable MobilePay (Recommended for Finland)

MobilePay is very popular in Finland. To enable it:

1. In your Stripe Dashboard, click **"Settings"** (gear icon)
2. Click **"Payment methods"**
3. Find **"MobilePay"** in the list
4. Click **"Turn on"**

Stripe will automatically show MobilePay as a payment option to Finnish customers.

#### Step 7: Test a Payment

1. Make sure your website is running with the **test** keys
2. Go to the online ordering page on your website
3. Add items to the cart and proceed to checkout
4. On the Stripe payment page, use the test card: **4242 4242 4242 4242**
5. Use any future expiry date (e.g., 12/30) and any CVC (e.g., 123)
6. Complete the payment
7. Check your **admin dashboard** — the order should appear
8. Check your **Stripe Dashboard** — the payment should appear under "Payments"

If everything works, you are ready to switch to **Live Mode** keys and accept real payments.

#### Quick Summary

| What you need | Where to find it | What it looks like |
|---------------|------------------|--------------------|
| Secret Key | Stripe Dashboard → Developers → API Keys | `sk_test_...` or `sk_live_...` |
| Webhook Secret | Stripe Dashboard → Developers → Webhooks → Your endpoint → Signing secret | `whsec_...` |

## How the Menu Works

The menu is stored in an online database.

That means:

- Customers only see items marked as available
- Staff can turn items on or off
- Prices and text can be updated from the admin panel

There is also a backup menu inside the project. This means that if the live menu has not been connected yet, the website can still show sample items instead of breaking completely.

---

## What You Can Usually Change Without a Developer

Once everything is fully connected, the client or staff should be able to manage these items without touching code:

- Menu items
- Item prices
- Item availability
- Item images through image URLs
- Order statuses
- Basic restaurant contact details

In simple terms: day-to-day restaurant changes should happen through the admin dashboard, not through coding.

---

## What Still Needs Final Setup Before Launch

Before the site can go fully live, a developer still needs to connect the business accounts and launch settings.

### Required

- A **Firebase** project
  - This stores menu items, orders, admin users, and site settings.
- A **Stripe** account with API access
  - This handles online payments.
- A **secure backend setup**
  - This includes Firebase Admin credentials so only the server can create paid orders.
- At least 1 **admin login**
  - So the restaurant can access the dashboard.
- A hosting setup
  - So the website is live on the internet.

### Optional but Recommended

- A business email account for order notifications
- A custom domain name
- Final legal pages such as Privacy Policy and Terms

---

## Simple Launch Checklist

This is the easiest way to think about launch:

1. Confirm the final restaurant name, phone, email, and address.
2. Confirm the final menu and prices.
3. Connect the payment account.
4. Create admin login details for staff.
5. Test one real order from start to finish.
6. Put the website on the live domain.

---

## Daily Use After Launch

For a non-technical owner or manager, daily use should be simple:

### When You Want To Check Orders

- Open the admin dashboard
- Look for new orders
- Update each order as it moves through the kitchen

### When You Want To Change the Menu

- Open the menu section in admin
- Edit or add the item
- Save the changes

### When an Item Is Sold Out

- Hide the item from the menu

This is better than deleting it, because it can be shown again later.

---

## Important Notes About the Current Build

This project is already strong as a working restaurant website, but there are a few things to be aware of in the current version:

- Some links in the footer, such as social media, privacy policy, and terms, are still placeholders.
- Opening hours, buffet hours, delivery fee, and business links now come from site settings and should be reviewed before launch.
- Branding now uses the **Sumi Sushi and Poke** name and the SVG logo, but final client approval is still recommended.
- Email notifications are optional and only work after a business email service is connected.
- Menu image URLs work now. Direct file upload is intentionally visible but disabled until Firebase Storage is enabled on a paid Firebase plan.
- Stripe and Firebase Admin credentials still need to be filled in for production before secure live payments can work.

These are normal final-stage polish items, not signs that the project is unusable.

---

## What the Client Needs To Keep Safe

The restaurant owner should keep these details safe and organized:

- Admin login email and password
- Stripe merchant login
- Firebase/project ownership access
- Hosting/domain login
- Business email login used for notifications

It is best if the business owner, not only the developer, has access to these accounts.

---

## If You Ever Move To a New Developer

If a new developer takes over later, they should receive:

- This whole project folder
- The hosting login
- The Stripe login
- The Firebase project access
- The admin login details
- The domain access

That will allow another developer to continue the project without rebuilding it from scratch.

---

## Plain-English Summary

This website is a modern restaurant system that helps the business do 3 things:

1. Present the restaurant brand professionally.
2. Accept online orders and payments.
3. Let staff manage orders and menu updates from one private dashboard.

For the restaurant owner, the main goal is simple:

**customers order online, staff receive orders quickly, and the menu can be updated without editing code.**

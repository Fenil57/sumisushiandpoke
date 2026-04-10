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

Payments are handled through **Flatpay** using a hosted secure checkout page.

The current setup is designed so that:

- The customer is redirected to Flatpay's secure payment page
- Card details stay with the payment provider, not inside this website
- The server verifies the payment before the restaurant order is created
- A backup webhook also helps ensure paid orders are not lost if the customer closes the page after payment

---

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
- A **Flatpay** merchant account with API access
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
- Flatpay and Firebase Admin credentials still need to be filled in for production before secure live payments can work.

These are normal final-stage polish items, not signs that the project is unusable.

---

## What the Client Needs To Keep Safe

The restaurant owner should keep these details safe and organized:

- Admin login email and password
- Flatpay merchant login
- Firebase/project ownership access
- Hosting/domain login
- Business email login used for notifications

It is best if the business owner, not only the developer, has access to these accounts.

---

## If You Ever Move To a New Developer

If a new developer takes over later, they should receive:

- This whole project folder
- The hosting login
- The Flatpay login
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

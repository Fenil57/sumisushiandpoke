# Sumi Sushi and Poke

Restaurant website with:

- Public home page
- Online ordering flow
- Flatpay hosted checkout with server-side payment verification
- Admin dashboard for orders, menu, and basic site settings

Project guides:

- Client handover guide: [CLIENT_PROJECT_GUIDE.md](./CLIENT_PROJECT_GUIDE.md)
- Delivery and handoff checklist: [PROJECT_COMPLETION_CHECKLIST.md](./PROJECT_COMPLETION_CHECKLIST.md)
- Technical backend notes: [BACKEND_REQUIREMENTS.md](./BACKEND_REQUIREMENTS.md)

Basic local commands:

```bash
npm install
npm run dev:all
```

This starts:

- Frontend on `http://localhost:3000`
- API server on `http://localhost:3001`

Environment values are listed in [.env.example](./.env.example).

Payment-related setup now needs:

- `APP_BASE_URL` for Flatpay return URLs
- `FLATPAY_PRIVATE_API_KEY` for checkout session creation
- `FLATPAY_WEBHOOK_USERNAME` and `FLATPAY_WEBHOOK_PASSWORD` for webhook authentication
- Firebase Admin credentials so the backend can create verified orders securely

Notes:

- `VITE_ENABLE_MENU_IMAGE_UPLOAD=false` keeps the future admin upload control visible but disabled until Firebase Storage is enabled.
- `VITE_API_BASE_URL` lets the frontend call the backend directly when you are not using the Vite dev proxy.
- The canonical brand asset is `src/assets/images/logo.png`.
- `NLS_API_KEY` enables Finnish delivery-address validation and the 5 km free-delivery check.
- `FLATPAY_PRIVATE_API_KEY` is required for secure Flatpay checkout session creation.
- Firebase Admin credentials are required so the backend, not the browser, creates orders after verified payment.

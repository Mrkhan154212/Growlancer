# Growlancer — Production Setup Guide

> **Production URL:** https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app
> **Supabase Project Ref:** `zttwsjehcgaicziqyxpq`
> **Supabase URL:** https://zttwsjehcgaicziqyxpq.supabase.co
> **Supabase Callback URL:** `https://zttwsjehcgaicziqyxpq.supabase.co/auth/v1/callback`

---

## TABLE OF CONTENTS

1. [Google OAuth Setup](#-1-google-oauth-setup)
2. [LinkedIn OAuth Setup](#-2-linkedin-oauth-setup)
3. [Razorpay Payment Setup (India)](#-3-razorpay-payment-setup-india)
4. [PayPal Payment Setup (International)](#-4-paypal-payment-setup-international)
5. [Brevo SMTP Setup](#-5-brevo-smtp-setup)
6. [Environment Variables Reference](#-6-environment-variables-reference)
7. [Required URLs Reference Table](#-7-required-urls-reference-table)
8. [Testing Checklist](#-8-testing-checklist)

---

## 🔵 1. GOOGLE OAUTH SETUP

### Step 1: Google Cloud Console

1. Go to **[Google Cloud Console](https://console.cloud.google.com/)** → **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Growlancer Production`

### Step 2: Add Authorized Redirect URIs

Add this exact URL:
```
https://zttwsjehcgaicziqyxpq.supabase.co/auth/v1/callback
```

For local development, also add:
```
http://localhost:5173/auth/v1/callback
```

### Step 3: Configure OAuth Consent Screen

| Field | Value |
|---|---|
| **App name** | Growlancer |
| **User support email** | support@growlancer.com (or your email) |
| **Application Homepage** | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app` |
| **Privacy Policy URL** | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/privacy` |
| **Terms of Service URL** | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/terms` |
| **Authorized Domains** | `growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app` |

### Step 4: Required Scopes

```
openid
.../auth/userinfo.email
.../auth/userinfo.profile
```

### Step 5: Supabase Configuration

1. Go to **Supabase Dashboard** → **Authentication** → **Providers** → **Google**
2. Toggle **Enabled** → ON
3. Paste **Client ID** and **Client Secret** from Google Cloud Console
4. **Save**

### Step 6: Environment Variables

```bash
# Already configured on Vercel ✅
VITE_SUPABASE_URL=https://zttwsjehcgaicziqyxpq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔵 2. LINKEDIN OAUTH SETUP

### Step 1: LinkedIn Developer Console

1. Go to **[LinkedIn Developer Portal](https://developer.linkedin.com/)** → **Create App**
2. App Name: `Growlancer`
3. LinkedIn Page: (Create a LinkedIn page or use personal)
4. **Create App**

### Step 2: Get Product Access

1. Go to **Products** tab
2. Request access to **"Sign In with LinkedIn using OpenID Connect"**
3. Wait for approval (usually instant)

### Step 3: Configure Auth

1. Go to **Auth** tab
2. Add **Authorized Redirect URLs**:

```
https://zttwsjehcgaicziqyxpq.supabase.co/auth/v1/callback
```

For local development:
```
http://localhost:5173/auth/v1/callback
```

### Step 4: Supabase Configuration

1. Go to **Supabase Dashboard** → **Authentication** → **Providers** → **LinkedIn (OIDC)**
2. Copy the **Callback URL** shown there (confirm it matches above)
3. Toggle **Enabled** → ON
4. Paste **Client ID** and **Client Secret** from LinkedIn Developer Console
5. **Save**

### Step 5: Code Configuration

The code already uses `linkedin_oidc` provider ✅
```typescript
// In AuthContext.tsx (already done)
signInWithOAuth('linkedin_oidc')
```

### Important Notes

- Use `linkedin_oidc` (NOT `linkedin`) — the old `linkedin` provider is deprecated
- OIDC scopes (`openid`, `profile`, `email`) are handled automatically
- AuthCallbackPage.tsx already handles the redirect ✅

---

## 🔴 3. RAZORPAY PAYMENT SETUP (INDIA)

### Step 1: Create Razorpay Account

1. Go to **[Razorpay Dashboard](https://dashboard.razorpay.com/)**
2. Sign up / Log in
3. Complete KYC verification (required for live mode)

### Step 2: Get API Keys

1. Navigate to **Settings** → **API Keys**
2. Click **Generate API Keys**
3. You will get:
   - **Key ID** (client-side safe)
   - **Key Secret** (server-side only — NEVER expose)
4. Save both securely

### Step 3: Configure Webhooks

1. Go to **Settings** → **Webhooks**
2. Click **Add Webhook**
3. Webhook URL:
```
https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/api/webhooks/razorpay
```
4. Select events:
   - `payment.authorized`
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
5. Create a **Webhook Secret** and save it

### Step 4: Environment Variables

Add these to Vercel:
```bash
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_ACCOUNT_NUMBER=xxxxxxxxxxxx
```

### Step 5: Test Mode vs Live Mode

| Mode | API Keys | Description |
|---|---|---|
| **Test** | `rzp_test_xxxx` | Use for development — no real money |
| **Live** | `rzp_live_xxxx` | Use in production — real transactions |

### Step 6: Supported Payment Methods

- UPI (Google Pay, PhonePe, Paytm)
- Credit/Debit Cards (Visa, Mastercard, RuPay)
- Net Banking
- Wallet
- EMI

---

## 🔵 4. PAYPAL PAYMENT SETUP (INTERNATIONAL)

### Step 1: PayPal Developer Dashboard

1. Go to **[PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)**
2. Log in with your PayPal Business account
3. Toggle to **Live** tab (not Sandbox)

### Step 2: Create REST API App

1. Click **Create App**
2. App Name: `Growlancer`
3. Select **Merchant** as the type
4. After creation, you'll get:
   - **Client ID** (safe for client-side)
   - **Secret** (server-side only)

### Step 3: Configure Webhooks

1. In your app settings, go to **Webhooks**
2. Click **Add Webhook**
3. Webhook URL:
```
https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/api/webhooks/paypal
```
4. Select events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`
   - `CHECKOUT.ORDER.APPROVED`
   - `BILLING.SUBSCRIPTION.CREATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`

### Step 4: Environment Variables

Add these to Vercel:
```bash
PAYPAL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_SANDBOX=false
PAYPAL_WEBHOOK_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 5: Sandbox vs Live

| Mode | API Endpoint | Use |
|---|---|---|
| **Sandbox** | `https://api-m.sandbox.paypal.com` | Testing |
| **Live** | `https://api-m.paypal.com` | Production |

### Step 6: Currency Support

- **USD** (default for international)
- EUR, GBP, AUD, CAD (supported by PayPal)

---

## 📧 5. BREVO SMTP SETUP

### Step 1: Create Brevo Account

1. Go to **[Brevo (formerly Sendinblue)](https://www.brevo.com/)**
2. Sign up for free account
3. Verify your domain (required for sending emails)

### Step 2: Get SMTP Credentials

1. Go to **Settings** → **SMTP & API**
2. Generate **SMTP Key**
3. Note down:
   - SMTP Server: `smtp-relay.brevo.com`
   - Port: `587`
   - Login: Your email
   - SMTP Key: Generated key

### Step 3: Configure Supabase Auth

1. Go to **Supabase Dashboard** → **Authentication** → **Settings** → **SMTP Settings**
2. Enable **Custom SMTP**
3. Fill in:

| Field | Value |
|---|---|
| **SMTP Host** | `smtp-relay.brevo.com` |
| **SMTP Port** | `587` |
| **Username** | `your-email@company.com` |
| **Password** | Your Brevo SMTP key |
| **Sender Email** | `noreply@growlancer.com` (or your domain) |
| **Sender Name** | `Growlancer` |

### Step 4: Required Email Templates

Supabase handles these automatically:
- ✅ Welcome email
- ✅ Email verification
- ✅ Password reset
- ✅ Invitations (custom)

### Step 5: Environment Variables

```bash
BREVO_SMTP_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
BREVO_SMTP_EMAIL=noreply@growlancer.com
BREVO_SMTP_NAME=Growlancer
```

---

## 📋 6. ENVIRONMENT VARIABLES REFERENCE

### Required — Already Set on Vercel ✅

```bash
VITE_SUPABASE_URL=https://zttwsjehcgaicziqyxpq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Auth Providers — Need to Add

```bash
# Google OAuth
GOOGLE_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxx

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=xxxxxxxxxxxxxxxxxx
LINKEDIN_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxx

# Supabase (already on dashboard, add service role for admin)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Payments — Need to Add

```bash
# Razorpay (India)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_ACCOUNT_NUMBER=xxxxxxxxxxxx

# PayPal (International)
PAYPAL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_SANDBOX=false
PAYPAL_WEBHOOK_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Email — Need to Add

```bash
# Brevo SMTP (configured in Supabase dashboard)
BREVO_SMTP_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
BREVO_SMTP_EMAIL=noreply@growlancer.com
BREVO_SMTP_NAME=Growlancer
```

### Optional

```bash
VITE_APP_VERSION=1.0.0
VITE_SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
APP_URL=https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app
```

---

## 🔗 7. REQUIRED URLS REFERENCE TABLE

### All URLs for Configuration

| Provider | URL Type | URL |
|---|---|---|
| **Website** | Production URL | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app` |
| **Supabase** | Auth Callback | `https://zttwsjehcgaicziqyxpq.supabase.co/auth/v1/callback` |
| **Website** | Privacy Policy | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/privacy` |
| **Website** | Terms of Service | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/terms` |
| **Website** | Homepage | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app` |
| **Website** | Contact | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/contact` |
| **Razorpay** | Webhook | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/api/webhooks/razorpay` |
| **PayPal** | Webhook | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/api/webhooks/paypal` |
| **App** | Auth Callback | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/auth/callback` |
| **App** | OAuth Redirect | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/auth/callback` |

### For Local Development

| Provider | URL |
|---|---|
| Local Dev Server | `http://localhost:5173` |
| Supabase Local CB | `http://localhost:5173/auth/v1/callback` |
| App Auth Callback | `http://localhost:5173/auth/callback` |

---

## ✅ 8. TESTING CHECKLIST

### Google OAuth

- [ ] Click "Continue with Google" in Login modal
- [ ] Select Google account
- [ ] Redirected to AuthCallbackPage
- [ ] Loading spinner shown
- [ ] Session established
- [ ] Redirected to correct dashboard based on role
- [ ] Logout works
- [ ] Login again uses existing account
- [ ] No duplicate accounts created

### LinkedIn OAuth

- [ ] Click "Continue with LinkedIn" in Login modal
- [ ] Authorize LinkedIn app
- [ ] Redirected to AuthCallbackPage
- [ ] Loading spinner shown
- [ ] Session established
- [ ] Redirected to correct dashboard
- [ ] Logout works
- [ ] Login again uses existing account
- [ ] Full name + email + profile image fetched

### Razorpay (India Test)

- [ ] Country detected as India
- [ ] Razorpay checkout opens
- [ ] Test payment with UPI
- [ ] Test payment with Card
- [ ] Payment success updates dashboard
- [ ] Payment failure shows error
- [ ] Payment cancellation handled
- [ ] Webhook received and verified
- [ ] Signature verified server-side
- [ ] Order status updated in real-time

### PayPal (International Test)

- [ ] Country detected as non-India
- [ ] PayPal checkout opens (Sandbox)
- [ ] Test payment with Sandbox buyer account
- [ ] Payment success updates dashboard
- [ ] Payment failure shows error
- [ ] Payment cancellation handled
- [ ] Webhook received and verified
- [ ] Order status updated in real-time
- [ ] Refund workflow works

### Real-Time Updates

- [ ] Dashboard updates instantly after payment
- [ ] Admin panel shows live transaction
- [ ] Notifications panel updates in real-time
- [ ] User count updates immediately
- [ ] Wallet balance updates after payment

---

> **Need Help?** Run `npx vercel env pull` locally to sync production env vars.
> **For Supabase:** Run migration SQL in Supabase SQL Editor.
> **For Vercel:** Push to GitHub repo for auto-deploy.

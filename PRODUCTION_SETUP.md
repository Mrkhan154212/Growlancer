# 🌟 Growlancer — Complete A to Z Production Setup Guide

> **Last Updated:** July 2026
> **Production URL:** https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app
> **GitHub Repo:** https://github.com/Mrkhan154212/Growlancer
> **Supabase Project Ref:** `zttwsjehcgaicziqyxpq`
> **Supabase Dashboard:** https://supabase.com/dashboard/project/zttwsjehcgaicziqyxpq
> **Vercel Dashboard:** https://vercel.com/mrkhan154212s-projects/growlancer

---

## 📑 TABLE OF CONTENTS

| # | Section | Description |
|---|---|---|
| 0 | [Quick Start](#-0-quick-start-cheat-sheet) | 🔥 1-minute cheat sheet |
| 1 | [Supabase Project Setup](#-1-supabase-project-setup) | Database, Auth, Storage, RLS |
| 2 | [Google OAuth Setup](#-2-google-oauth-setup) | Google login with all URLs |
| 3 | [LinkedIn OAuth Setup](#-3-linkedin-oauth-setup) | LinkedIn login with all URLs |
| 4 | [Razorpay Setup (India)](#-4-razorpay-payment-setup-india) | Indian payments with webhooks |
| 5 | [PayPal Setup (International)](#-5-paypal-payment-setup-international) | Global payments with webhooks |
| 6 | [Brevo SMTP Setup](#-6-brevo-smtp-setup) | Transactional emails |
| 7 | [Vercel Setup & Auto-Deploy](#-7-vercel-setup--auto-deploy) | Hosting + GitHub auto-deploy |
| 8 | [Custom Domain Setup](#-8-custom-domain-setup) | Your own domain name |
| 9 | [Environment Variables](#-9-environment-variables) | Complete list |
| 10 | [Required URLs Reference](#-10-required-urls-reference-table) | ALL URLs in one table |
| 11 | [SQL Migration Guide](#-11-sql-migration-guide) | Database schema updates |
| 12 | [Testing Checklist](#-12-testing-checklist) | Step-by-step QA |
| 13 | [Troubleshooting](#-13-troubleshooting) | Common issues & fixes |

---

## 🔥 0. QUICK START CHEAT SHEET

### Step 1: Supabase — Run SQL Migration
```
Open: https://supabase.com/dashboard/project/zttwsjehcgaicziqyxpq/sql/new
Paste: supabase/migrations/20260701000000_production_audit_fixes.sql
Run it!
```

### Step 2: Vercel — Connect GitHub
```
Open: https://vercel.com/mrkhan154212s-projects/growlancer/settings/git
Click: "Connect Git Repository"
Select: Mrkhan154212/Growlancer
Auto-deploy starts on every git push ✅
```

### Step 3: Configure OAuth Providers
```
Supabase → Authentication → Providers
- Enable Google → paste Client ID + Secret
- Enable LinkedIn (OIDC) → paste Client ID + Secret
```

### Step 4: Set Environment Variables on Vercel
```
Vercel Dashboard → Project → Settings → Environment Variables
Add all vars from Section 9 below
```

### Step 5: Configure Brevo SMTP
```
Supabase → Authentication → Settings → SMTP Settings
Enable Custom SMTP → Use Brevo credentials
```

---

## 🗄️ 1. SUPABASE PROJECT SETUP

### Production Supabase URL
```
https://zttwsjehcgaicziqyxpq.supabase.co
```

### Access Supabase Dashboard
```
https://supabase.com/dashboard/project/zttwsjehcgaicziqyxpq
```

### A. Authentication Settings

#### Site URL
```
https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app
```

#### Redirect URLs (add ALL of these)
```
https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/auth/callback
http://localhost:5173/auth/callback
```

### B. SMTP Settings (For Transactional Emails)

Configure Brevo SMTP here (see Section 6).

### C. Run SQL Migration

1. Go to **SQL Editor** → **New Query**
2. Open `supabase/migrations/20260701000000_production_audit_fixes.sql`
3. Copy the entire SQL
4. Paste into SQL Editor
5. Click **Run**

**This migration will:**
- ✅ Add suspension fields to profiles (`suspended_at`, `suspend_reason`, `suspended_by`)
- ✅ Create Razorpay orders & transactions tables
- ✅ Create `cleanup_user_data()` function for safe account deletion
- ✅ Create `is_user_suspended()` function for RLS
- ✅ Create `active_users` view (excludes deleted/suspended)
- ✅ Add performance indexes
- ✅ Add admin RLS policies

### D. Enable Realtime (For Live Updates)

Go to **Database** → **Replication** → **Enable** for these tables:
- `profiles`
- `notifications`
- `contracts`
- `messages`
- `dispute_cases`

---

## 🔵 2. GOOGLE OAUTH SETUP

### Step 1: Google Cloud Console

| Action | Details |
|---|---|
| **URL** | https://console.cloud.google.com/ |
| **Navigate** | APIs & Services → Credentials |
| **Create** | Create Credentials → OAuth client ID |
| **Type** | Web application |
| **Name** | `Growlancer` |

### Step 2: Authorized Redirect URIs

Add these EXACT URLs:

| # | URL | Purpose |
|---|---|---|
| 1 | `https://zttwsjehcgaicziqyxpq.supabase.co/auth/v1/callback` | **Production** — Supabase callback |
| 2 | `http://localhost:5173/auth/v1/callback` | **Local Dev** — For testing |

> ⚠️ The Supabase callback URL is shown in your Supabase Dashboard under:
> **Authentication → Providers → Google**

### Step 3: Authorized JavaScript Origins

| # | URL | Purpose |
|---|---|---|
| 1 | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app` | Production |
| 2 | `http://localhost:5173` | Local Dev |

### Step 4: OAuth Consent Screen — REQUIRED FIELDS

| Field | Value to Enter |
|---|---|
| **App Name** | Growlancer |
| **User Support Email** | `your-email@gmail.com` (your email) |
| **App Logo** | Upload Growlancer logo |
| **Application Homepage** | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app` |
| **Application Privacy Policy** | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/privacy` |
| **Application Terms of Service** | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/terms` |
| **Authorized Domains** | `growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app` |
| **Developer Contact Info** | Your email address |

### Step 5: Required Scopes

Add these scopes:
```
☑ openid
☑ .../auth/userinfo.email
☑ .../auth/userinfo.profile
```
> No other scopes needed — keep it minimal to avoid Google verification delays.

### Step 6: Supabase Configuration

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Click **Google**
3. Toggle **Enabled** → **ON**
4. Paste **Client ID** from Google Cloud Console
5. Paste **Client Secret** from Google Cloud Console
6. Click **Save**

### Step 7: Test It

1. Open your website: https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app
2. Click **Login** → **Continue with Google**
3. You should be redirected to Google, then back to your site
4. ✅ Done!

---

## 🔵 3. LINKEDIN OAUTH SETUP

### Step 1: LinkedIn Developer Portal

| Action | Details |
|---|---|
| **URL** | https://developer.linkedin.com/ |
| **Create App** | Click "Create App" |
| **App Name** | `Growlancer` |
| **LinkedIn Page** | Create a LinkedIn Page or skip |
| **App Logo** | Upload Growlancer logo |

### Step 2: Request Product Access

1. Go to **Products** tab
2. Find **"Sign In with LinkedIn using OpenID Connect"**
3. Click **Request Access**
4. Approval is usually instant ✅

### Step 3: Configure Auth (Redirect URLs)

1. Go to **Auth** tab
2. Under **Authorized Redirect URLs for your app**, add:

| # | URL | Purpose |
|---|---|---|
| 1 | `https://zttwsjehcgaicziqyxpq.supabase.co/auth/v1/callback` | **Production** |
| 2 | `http://localhost:5173/auth/v1/callback` | **Local Dev** |

3. Click **Update**

### Step 4: Get Credentials

1. In the **Auth** tab, copy:
   - **Client ID** (starts with `86...`)
   - **Client Secret** (click to reveal, copy immediately)
2. Save these securely!

### Step 5: Supabase Configuration

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Click **LinkedIn (OIDC)**
3. Copy the **Callback URL** shown (confirm it's: `https://zttwsjehcgaicziqyxpq.supabase.co/auth/v1/callback`)
4. Toggle **Enabled** → **ON**
5. Paste **Client ID** from LinkedIn
6. Paste **Client Secret** from LinkedIn
7. Click **Save**

### Step 6: Test It

1. Open your website
2. Click **Login** → **Continue with LinkedIn**
3. You should be redirected to LinkedIn, then back to your site
4. ✅ Done!

### ⚠️ IMPORTANT: Use `linkedin_oidc`

The code already uses the correct provider:
```typescript
// src/context/AuthContext.tsx (already done ✅)
signInWithOAuth('linkedin_oidc')
```

> **Do NOT use** `'linkedin'` (old provider) — it's deprecated.
> **Always use** `'linkedin_oidc'` (new OIDC provider).

---

## 🔴 4. RAZORPAY PAYMENT SETUP (INDIA)

### Step 1: Create Razorpay Account

| Action | Details |
|---|---|
| **URL** | https://dashboard.razorpay.com/ |
| **Sign Up** | Create account with your business details |
| **KYC** | Complete KYC verification (required for live payments) |

### Step 2: Get API Keys

1. Go to **Settings** → **API Keys**
2. Click **Generate API Keys**
3. You'll get:

| Key | Example | Where to use |
|---|---|---|
| **Key ID** | `rzp_live_xxxxxxxxxxxx` | Frontend (safe) |
| **Key Secret** | `xxxxxxxxxxxxxxxx` | Backend only (NEVER expose) |

> **Test Mode Keys:** `rzp_test_xxxxxxxx` — Use for development
> **Live Mode Keys:** `rzp_live_xxxxxxxx` — Use for production

### Step 3: Configure Webhooks

1. Go to **Settings** → **Webhooks**
2. Click **Add Webhook**

| Field | Value |
|---|---|
| **Webhook URL** | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/api/webhooks/razorpay` |
| **Subscribed Events** | Select ALL: `payment.authorized`, `payment.captured`, `payment.failed`, `order.paid` |
| **Secret** | Generate a strong secret (save this!) |

### Step 4: Environment Variables (Add to Vercel)

```bash
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 5: Signature Verification (Security)

Razorpay payments MUST be verified server-side:

```javascript
// You MUST verify payment signature before fulfilling orders
// Razorpay SDK provides: Utils.verifyPaymentSignature()
// Uses: HMAC SHA256 with your Key Secret
```

---

## 🔵 5. PAYPAL PAYMENT SETUP (INTERNATIONAL)

### Step 1: PayPal Developer Dashboard

| Action | Details |
|---|---|
| **URL** | https://developer.paypal.com/dashboard/ |
| **Login** | Use your PayPal **Business** account |
| **Toggle** | Switch to **Live** tab (NOT Sandbox) |

### Step 2: Create REST API App

1. Click **Create App**
2. App Name: `Growlancer`
3. Type: **Merchant**
4. After creation, you'll see:

| Key | Where to use |
|---|---|
| **Client ID** | Frontend (safe for client-side) |
| **Secret** | Backend only (NEVER expose) |

### Step 3: Configure Webhooks

1. In your app, go to **Webhooks**
2. Click **Add Webhook**
3. Webhook URL:
```
https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/api/webhooks/paypal
```
4. Select events:
```
☑ PAYMENT.CAPTURE.COMPLETED
☑ PAYMENT.CAPTURE.DENIED
☑ PAYMENT.CAPTURE.REFUNDED
☑ CHECKOUT.ORDER.APPROVED
☑ BILLING.SUBSCRIPTION.CREATED
☑ BILLING.SUBSCRIPTION.CANCELLED
```

### Step 4: Environment Variables (Add to Vercel)

```bash
PAYPAL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_SANDBOX=false
PAYPAL_WEBHOOK_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 5: Sandbox vs Live

| Mode | API Endpoint | Use Case |
|---|---|---|
| **Sandbox** | `https://api-m.sandbox.paypal.com` | Testing with fake money |
| **Live** | `https://api-m.paypal.com` | Production with real money |

---

## 📧 6. BREVO SMTP SETUP

### Step 1: Create Brevo Account

| Action | Details |
|---|---|
| **URL** | https://www.brevo.com/ |
| **Sign Up** | Free account (300 emails/day free) |
| **Verify Domain** | Add & verify your domain |

### Step 2: Get SMTP Credentials

1. Go to **Settings** → **SMTP & API**
2. Click **Generate SMTP Key**
3. Note down:

| Field | Value |
|---|---|
| **SMTP Server** | `smtp-relay.brevo.com` |
| **Port** | `587` (TLS) or `465` (SSL) |
| **Login** | Your Brevo login email |
| **SMTP Key** | `xsmtpsib-xxxxxxxxxxxxxxx...` |

### Step 3: Configure Supabase Auth SMTP

1. Go to **Supabase Dashboard** → **Authentication** → **Settings** → **SMTP Settings**
2. Enable **Custom SMTP**
3. Fill in:

| Field | Value |
|---|---|
| **SMTP Host** | `smtp-relay.brevo.com` |
| **SMTP Port** | `587` |
| **Username** | `your-email@company.com` |
| **Password** | Brevo SMTP Key |
| **Sender Email** | `noreply@growlancer.com` |
| **Sender Name** | `Growlancer` |

4. Click **Save**

### Step 4: Verify Emails Work

- Sign up a new user → Check if verification email arrives
- Request password reset → Check if reset email arrives
- Login as admin → Send an invite → Check if invite email arrives

---

## 🚀 7. VERCEL SETUP & AUTO-DEPLOY

### Current Vercel Project
```
Dashboard: https://vercel.com/mrkhan154212s-projects/growlancer
Production URL: https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app
```

### Connect GitHub for Auto-Deploy

**Option A: From Vercel Dashboard (Recommended)**
1. Go to: https://vercel.com/mrkhan154212s-projects/growlancer/settings/git
2. Click **"Connect Git Repository"**
3. Select: `Mrkhan154212/Growlancer`
4. ✅ **Auto-deploy enabled!** — Every `git push` deploys automatically

**Option B: From CLI**
```bash
npx vercel git connect https://github.com/Mrkhan154212/Growlancer.git
```

### Deploy Workflow

```bash
# 1. Make changes
git add -A

# 2. Commit
git commit -m "Description of changes"

# 3. Push to GitHub (triggers auto-deploy on Vercel)
git push

# 4. Vercel automatically builds & deploys ✅
#    Check status: https://vercel.com/mrkhan154212s-projects/growlancer/deployments
```

### Manual Deploy (if needed)
```bash
npx vercel --prod
```

### Production Branch
```
Branch: master → Auto-deploys to production
```

### Preview Deployments
- Every pull request gets its own preview URL
- Great for testing before merging to production

### Environment Variables on Vercel

To add env vars:
```
Vercel Dashboard → growlancer → Settings → Environment Variables
Add all variables from Section 9 below
```

To pull env vars locally:
```bash
npx vercel env pull
```

---

## 🌐 8. CUSTOM DOMAIN SETUP

### Option A: Add Your Own Domain (Recommended)

Currently using Vercel's `.vercel.app` domain. To use your own domain:

1. Go to: https://vercel.com/mrkhan154212s-projects/growlancer/settings/domains
2. Enter your domain (e.g., `growlancer.com`)
3. Follow Vercel's DNS configuration instructions
4. Update Supabase Site URL to your new domain

### Option B: Keep Vercel Domain (Current)

Your current URL works fine:
```
https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app
```

### If You Add a Custom Domain — Update These:

After adding a custom domain `https://growlancer.com`:

| Location | Update To |
|---|---|
| **Supabase → Site URL** | `https://growlancer.com` |
| **Supabase → Redirect URLs** | `https://growlancer.com/auth/callback` |
| **Google Cloud Console → URIs** | `https://growlancer.com` |
| **LinkedIn → Redirect URLs** | `https://growlancer.com/...` |
| **Vercel → Domains** | Already handles it |
| **This guide → URLs** | Update all URLs |

---

## 🔑 9. ENVIRONMENT VARIABLES

### Already Set on Vercel ✅

```bash
VITE_SUPABASE_URL=https://zttwsjehcgaicziqyxpq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0dHdzamVoY2dhaWN6aXF5eHBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3OTYxNTIsImV4cCI6MjA5MjM3MjE1Mn0.zMRcvNcROFFxISRk7Nthf2Zc2JW6olNbWs603X87i5U
```

### Need to Add — Google OAuth

```bash
GOOGLE_CLIENT_ID=xxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```
> Get from: Google Cloud Console → Credentials

### Need to Add — LinkedIn OAuth

```bash
LINKEDIN_CLIENT_ID=86xxxxxxxxxxxx
LINKEDIN_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```
> Get from: LinkedIn Developer Portal → Auth tab

### Need to Add — Supabase Service Role (for Admin)

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
> Get from: Supabase Dashboard → Settings → API → `service_role key`
> ⚠️ This has admin privileges — keep it server-side only!

### Need to Add — Razorpay (India Payments)

```bash
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```
> Get from: Razorpay Dashboard → Settings → API Keys

### Need to Add — PayPal (International Payments)

```bash
PAYPAL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_SANDBOX=false
PAYPAL_WEBHOOK_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
> Get from: PayPal Developer Dashboard → Apps & Credentials

### Need to Add — Optional

```bash
VITE_APP_VERSION=1.0.0
VITE_SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@xxxxxxxxx.ingest.sentry.io/xxxxxx
APP_URL=https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app
```

---

## 📎 10. REQUIRED URLS REFERENCE TABLE

### ALL URLs — Copy-Paste Ready

| Provider | Setting | URL |
|---|---|---|
| **Supabase** | Site URL | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app` |
| **Supabase** | Auth Callback | `https://zttwsjehcgaicziqyxpq.supabase.co/auth/v1/callback` |
| **Supabase** | Redirect URL | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/auth/callback` |
| **Vercel** | Production URL | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app` |
| **Vercel** | GitHub Repo | `https://github.com/Mrkhan154212/Growlancer` |
| **Vercel** | Dashboard | `https://vercel.com/mrkhan154212s-projects/growlancer` |
| **Supabase** | Dashboard | `https://supabase.com/dashboard/project/zttwsjehcgaicziqyxpq` |
| **Supabase** | SQL Editor | `https://supabase.com/dashboard/project/zttwsjehcgaicziqyxpq/sql/new` |
| **Google** | Cloud Console | `https://console.cloud.google.com/` |
| **Google** | Redirect URI | `https://zttwsjehcgaicziqyxpq.supabase.co/auth/v1/callback` |
| **Google** | Homepage URI | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app` |
| **Google** | Privacy Policy | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/privacy` |
| **Google** | Terms of Service | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/terms` |
| **Google** | Authorized Domain | `growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app` |
| **LinkedIn** | Developer Portal | `https://developer.linkedin.com/` |
| **LinkedIn** | Redirect URI | `https://zttwsjehcgaicziqyxpq.supabase.co/auth/v1/callback` |
| **Razorpay** | Dashboard | `https://dashboard.razorpay.com/` |
| **Razorpay** | Webhook URL | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/api/webhooks/razorpay` |
| **PayPal** | Developer Dashboard | `https://developer.paypal.com/dashboard/` |
| **PayPal** | Webhook URL | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/api/webhooks/paypal` |
| **Brevo** | Dashboard | `https://www.brevo.com/` |
| **Website** | Homepage | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app` |
| **Website** | Login | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/?modal=login` |
| **Website** | Signup | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/?modal=signup` |
| **Website** | Admin | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/admin` |
| **Website** | Privacy | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/privacy` |
| **Website** | Terms | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/terms` |
| **Website** | Contact | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/contact` |
| **Website** | OAuth Callback | `https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app/auth/callback` |

### For Local Development

| Service | URL |
|---|---|
| **Dev Server** | `http://localhost:5173` |
| **Supabase Callback** | `http://localhost:5173/auth/v1/callback` |
| **App Auth Callback** | `http://localhost:5173/auth/callback` |
| **Login Modal** | `http://localhost:5173/?modal=login` |

---

## 🗃️ 11. SQL MIGRATION GUIDE

### How to Run Migrations

```
1. Open: https://supabase.com/dashboard/project/zttwsjehcgaicziqyxpq/sql/new
2. Copy SQL from: supabase/migrations/20260701000000_production_audit_fixes.sql
3. Paste into SQL Editor
4. Click "Run" button
```

### What the Migration Does

| Change | Table | Purpose |
|---|---|---|
| `suspended_at` column | `profiles` | When user was suspended |
| `suspend_reason` column | `profiles` | Why user was suspended |
| `suspended_by` column | `profiles` | Admin who suspended |
| `banned_at` column | `profiles` | Permanent ban timestamp |
| `razorpay_orders` table | NEW | Razorpay order tracking |
| `razorpay_transactions` table | NEW | Razorpay payment records |
| `active_users` view | NEW | Filters deleted/suspended |
| `cleanup_user_data()` function | NEW | Cascade delete user data |
| `is_user_suspended()` function | NEW | RLS check for suspension |
| Indexes | Multiple | Performance optimization |
| RLS Policies | Multiple | Admin access rules |

---

## ✅ 12. TESTING CHECKLIST

### 🟢 Google OAuth
```
☐ Open website → Click "Login"
☐ Click "Continue with Google"
☐ Select Google account → Authorize
☐ Redirected to AuthCallbackPage (loading spinner)
☐ Session established → Redirected to dashboard
☐ User profile created in Supabase
☐ Logout works → Login again works
☐ No duplicate accounts
```

### 🟢 LinkedIn OAuth
```
☐ Open website → Click "Login"
☐ Click "Continue with LinkedIn"
☐ Authorize LinkedIn app
☐ Redirected to AuthCallbackPage (loading spinner)
☐ Session established → Redirected to dashboard
☐ Profile fetched with name, email, avatar
☐ Logout works → Login again works
☐ No duplicate accounts
```

### 🟢 Email/Password Login
```
☐ Sign up with email + password
☐ Verification email received (via Brevo SMTP)
☐ Click verification link → Email confirmed
☐ Login with credentials
☐ Redirected to correct dashboard
☐ Forgot password → Reset email received
☐ Reset password → Login with new password
```

### 🟢 Razorpay (India — Test)
```
☐ Login from India IP / set country to India
☐ Create deposit → Razorpay checkout opens
☐ Test UPI payment
☐ Test Card payment
☐ Payment success → Dashboard updates
☐ Payment failure → Error shown
☐ Payment cancelled → Redirected back
☐ Webhook received → Status updated
☐ Signature verified server-side
```

### 🟢 PayPal (International — Test)
```
☐ Login from non-India IP
☐ Create deposit → PayPal checkout opens
☐ Test with Sandbox buyer
☐ Payment success → Dashboard updates
☐ Payment failure → Error shown
☐ Payment cancelled → Redirected back
☐ Webhook received → Status updated
```

### 🟢 Admin Dashboard
```
☐ Navigate to /admin
☐ View Users → Real-time user list
☐ Suspend user → User blocked immediately
☐ Reactivate user → User can login again
☐ Suspended user tries login → Blocked
☐ View Projects → Real-time list
☐ View Contracts → Escrow tracking
☐ View Payments → Transaction history
☐ View Disputes → Resolution workflow
☐ View Subscriptions → Plan management
☐ View Reports → Platform analytics
☐ AI Risk Analysis loads with real data
☐ Live Feed shows real activity
```

### 🟢 Real-Time Updates
```
☐ Admin dashboard updates without refresh
☐ User list updates when new user signs up
☐ Notifications appear in real-time
☐ Dispute status updates live
☐ User count updates immediately
```

---

## 🛠️ 13. TROUBLESHOOTING

### "Redirect URI Mismatch" (Google/LinkedIn)
```
Fix: Check the redirect URI in provider settings
Must exactly match: https://zttwsjehcgaicziqyxpq.supabase.co/auth/v1/callback
```

### "WebSocket connection failed" (Supabase)
```
Fix: Enable Realtime in Supabase
Database → Replication → Enable for tables
```

### "Cannot find module" (Build Error)
```
Fix: Delete node_modules + reinstall
rm -rf node_modules && npm install
```

### Vercel Build Failing
```
Fix: Check build logs
https://vercel.com/mrkhan154212s-projects/growlancer/deployments
```

### Git Push Fails ("Permission denied")
```
Fix: Add collaborator on GitHub
GitHub Repo → Settings → Collaborators → Add person
```

### Emails Not Sending
```
Fix: Check Brevo SMTP in Supabase
Authentication → Settings → SMTP Settings
```

### User Count Shows Wrong Number
```
Fix: Run SQL migration
Adds .is('suspended_at', null) to all queries
```

### Supabase Realtime Not Working
```
Fix: Run SQL migration for realtime
supabase/migrations/20260219120000_enable_realtime_workflow_tables.sql
```

---

## 📦 KEY LINKS — QUICK ACCESS

| 🔗 | Link |
|---|---|
| 🌐 **Live Website** | https://growlancer-nbpv5qifp-mrkhan154212s-projects.vercel.app |
| 📊 **Vercel Dashboard** | https://vercel.com/mrkhan154212s-projects/growlancer |
| 🗄️ **Supabase Dashboard** | https://supabase.com/dashboard/project/zttwsjehcgaicziqyxpq |
| 💻 **GitHub Repo** | https://github.com/Mrkhan154212/Growlancer |
| 🔵 **Google Cloud Console** | https://console.cloud.google.com/ |
| 🔵 **LinkedIn Developer** | https://developer.linkedin.com/ |
| 🔴 **Razorpay Dashboard** | https://dashboard.razorpay.com/ |
| 🔵 **PayPal Developer** | https://developer.paypal.com/dashboard/ |
| 📧 **Brevo (SMTP)** | https://www.brevo.com/ |

---

> **💡 Pro Tip:** Bookmark this page! All your production URLs and setup steps are here.
> **❓ Need Help?** Run `npx vercel env pull` to sync production env vars locally.
> **🔄 Auto-Deploy:** Push to GitHub → Vercel auto-deploys. Every time.

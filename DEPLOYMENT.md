# ASAS CRM - Production Deployment Guide

This guide provides step-by-step instructions to deploy the ASAS CRM application. The application consists of two main components:
1. **Frontend**: A Next.js application designed to be deployed on **Vercel**.
2. **Backend**: A Hono.js API server designed to be deployed as a serverless function on **Cloudflare Workers** (leveraging Cloudflare R2 for highly optimized file storage).

---

## 🛠️ Phase 1: Deploy Backend (Cloudflare Workers)

Since the backend utilizes native **Cloudflare R2 Bucket** bindings for premium file-upload capabilities, it is highly recommended to deploy the backend on **Cloudflare Workers**.

### 1. Prerequisite Checklist
- [Cloudflare Account](https://dash.cloudflare.com/) (Free Tier is perfectly fine).
- Neon PostgreSQL Database (you can reuse the existing `DATABASE_URL` in `wrangler.toml` or create a new one).

### 2. Configure wrangler.toml
Open [backend/wrangler.toml](file:///mnt/hdd/ASAS%20CRM/backend/wrangler.toml) and update your production variables:
- **`DATABASE_URL`**: Set to your PostgreSQL connection string.
- **`R2_PUBLIC_URL`**: Once you configure your Cloudflare R2 public access or custom domain, update this URL.

### 3. Deploy to Cloudflare
From your terminal, navigate to the `backend` folder and run the wrangler deploy command:
```bash
cd backend
npx wrangler deploy
```

*(If you are not logged in, Wrangler will prompt you to authenticate with your browser automatically).*

### 4. Create and Bind the R2 Bucket
If you haven't created the `asas-crm-documents` R2 bucket in your Cloudflare dashboard:
1. Go to the **Cloudflare Dashboard** -> **R2 Object Storage** -> **Create Bucket**.
2. Name the bucket `asas-crm-documents`.
3. In the bucket settings, enable **Public Access** (either via custom domain or cloudflare `r2.dev` subdomain) and copy the URL to set as your `R2_PUBLIC_URL`.

---

## 🚀 Phase 2: Deploy Frontend (Vercel)

The Next.js frontend is fully optimized to run natively on Vercel with zero configuration.

### 1. Import Repository
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** -> **Project**.
3. Select your Git repository containing the ASAS CRM monorepo.

### 2. Configure Monorepo Settings
During the import setup on Vercel:
- **Framework Preset**: Detects `Next.js` automatically.
- **Root Directory**: Click "Edit" and set this to **`frontend`** (This ensures Vercel compiles only the React frontend code).

### 3. Setup Environment Variables
Under the **Environment Variables** accordion, add the following key:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://backend.<your-subdomain>.workers.dev/api` | The live URL of your deployed Cloudflare Workers backend. |

### 4. Deploy!
Click **Deploy**. Vercel will install the dependencies, build the optimized Next.js static and dynamic routing nodes, and deploy your site to production!

---

## ⚡ Done!
Your Next.js frontend on Vercel is now securely connected to your Hono serverless backend on Cloudflare Workers, talking directly to your Cloudflare R2 bucket and Neon PostgreSQL database. All operations (timezones, logos, login page hide/show, analytics, pipelines, and pagination) will run dynamically at production scale!

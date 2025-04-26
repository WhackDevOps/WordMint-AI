# 🧠 WordMint AI

WordMint is a lightweight SaaS platform that generates SEO-optimized content using GPT-4 — fully automated and monetized via Stripe. Just enter a topic, pay securely, and receive high-quality content within seconds.

---

## 🚀 Live Demo

👉 [Launch App](https://learn-pro-ethanbfreelance.replit.app/)

---

## 🔥 Features

- 🧾 **Stripe Checkout Integration** – Payments trigger generation via secure webhooks  
- 🤖 **GPT-4 Powered** – Generates SEO blog articles based on topic + word count  
- 🗃 **MongoDB Atlas Storage** – Persists user data, orders, and settings  
- 🧠 **Smart Fallback** – In-memory mode when DB connection fails  
- 🔐 **Admin Dashboard** – Manage orders, monitor usage  
- 🧩 **Modular Structure** – Easily clone for niche verticals or white-labeled clients  

---

## 🛠 Tech Stack

- **Frontend**: React + TypeScript + ShadCN UI  
- **Backend**: Express + Node.js + TypeScript  
- **Database**: MongoDB Atlas (via Mongoose)  
- **AI**: OpenAI GPT-4o  
- **Payments**: Stripe Webhooks  
- **Hosting**: Replit Autoscale

---

## 📦 Installation

```bash
git clone https://github.com/whackdevops/WordMint-AI.git
cd WordMint-AI
npm install
```

Create a `.env` file from `.env.example` and add:

```env
OPENAI_API_KEY=your_openai_key
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=custom_session_key
VITE_STRIPE_PUBLIC_KEY=your_publishable_key
```

---

## ▶️ Run Locally

```bash
npm run dev
```

Frontend: `http://localhost:5000`  
Admin Panel: `http://localhost:5000/admin`  
Default login:
```
Username: admin  
Password: admin123
```

---

## 🧪 Test it Out

Use [Stripe Sandbox](https://dashboard.stripe.com/test/apikeys) with test cards (e.g., `4242 4242 4242 4242`) to simulate real orders.

---

## 📈 Growth Plan

This project can be cloned to target:
- Niche industries (e.g., legal, health, tech)
- Influencers or agencies selling branded content
- SaaS owners who want self-generating blog traffic

> Want to partner or license this framework? [Contact Ethan](https://github.com/ethanbfreelance)

---

## 📜 License

MIT – Free for personal or commercial use. Attribution appreciated.

---

Built with ❤️ by [Ethan Blankenship](https://github.com/ethanbfreelance) under the **WhackDevOps** brand.

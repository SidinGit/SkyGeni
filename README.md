# SkyGeni - Revenue Intelligence Console

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![MUI](https://img.shields.io/badge/MUI-%23007FFF.svg?style=for-the-badge&logo=mui&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![D3.js](https://img.shields.io/badge/d3.js-F9A03C?style=for-the-badge&logo=d3.js&logoColor=white)
![Swagger](https://img.shields.io/badge/-Swagger-%23Clojure?style=for-the-badge&logo=swagger&logoColor=white)

## 🚀 Overview

The **Revenue Intelligence Console** is a single-page application designed to help CROs and Sales Leaders visualize their team's performance. It answers the critical question: *"Why are we behind (or ahead) on revenue this quarter, and what should we focus on right now?"*

The system aggregates data from deals, accounts, and representatives to provide actionable insights, risk factors, and real-time revenue trends.

## ✨ Key Features

*   **Executive Summary**: Real-time snapshot of Current Quarter Revenue vs. Target, Gap analysis, and QoQ growth.
*   **Revenue Trend Visualization**: Interactive D3.js chart showing monthly revenue performance based on "Closed Won" deals.
*   **Performance Drivers**: detailed metrics on Pipeline Health, Win Rates, Deal Sizes, and Sales Cycle length.
*   **Risk Analysis**: Automated identification of stale deals, underperforming reps, and at-risk accounts.
*   **Smart Recommendations**: Rule-based actionable suggestions to improve revenue outcomes.
*   **API Documentation**: Comprehensive Swagger UI for backend endpoints.

## 🛠️ Architecture

*   **Frontend**: Built with **React** (Vite) and **Material UI** for a responsive, professional dashboard. Uses **D3.js** for custom data visualization.
*   **Backend**: **Node.js/Express** server using **TypeScript**.
*   **Data Layer**: **Prisma ORM** interfacing with a local dataset (simulated as a database).
*   **Documentation**: **Swagger/OpenAPI** auto-generated documentation.

## 📦 Project Structure

```bash
SkyGeni_Assignment/
├── backend/           # Express + Prisma API Server
│   ├── src/
│   │   ├── controllers/  # Business logic (Summary, Trend, Drivers)
│   │   ├── routes/       # API Definitions & Swagger Docs
│   └── prisma/           # Database Schema
├── frontend/          # React + Vite Application
│   ├── src/
│   │   ├── components/   # UI & Chart Components
│   │   └── api/          # Type-safe API integration
├── data/              # Source JSON data files
└── THINKING.md        # Architecture decisions & tradeoffs
```

## ⚡ Getting Started

### Prerequisites
*   Node.js (v16+)
*   npm or yarn

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository_url>
    cd SkyGeni_Assignment
    ```

2.  **Setup Backend**:
    ```bash
    cd backend
    npm install
    # Ensure database/prisma is generated
    npx prisma generate
    ```

3.  **Setup Frontend**:
    ```bash
    cd ../frontend
    npm install
    ```

### 🏃‍♂️ Running the Application

You need to run both the frontend and backend servers.

**1. Start Backend Server:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:3000
# Swagger Docs: http://localhost:3000/api-docs
```

**2. Start Frontend Application:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

## 🧪 Deployment

*   **Frontend**: Build with `npm run build` (outputs to `dist/`).
*   **Backend**: Build with `npm run build` (outputs to `dist/`).

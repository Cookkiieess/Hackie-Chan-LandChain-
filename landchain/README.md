# LandChain

LandChain is a digital property transfer platform for India built as a monorepo with a React frontend and a Node.js/Express backend.

It demonstrates:
- Aadhaar + OTP-style mock authentication
- land record fetching and AI summary generation
- seller to buyer transfer workflow
- owned properties inventory per user
- registrar and panchayat approval flow
- final payment confirmation
- immutable ownership history using a MongoDB-backed linked-list blockchain model

## Tech Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express, Mongoose
- Database: MongoDB Atlas
- AI: Gemini 1.5 Flash
- Blockchain model: custom linked-list stored in MongoDB

## Project Structure

```text
landchain/
├── backend/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

## Prerequisites

- Node.js 18 or newer
- MongoDB Atlas account
- Gemini API key

## Environment Setup

Backend environment file:
- [backend/.env](C:\Users\Vernon\Pictures\HACKPRIX\Hackie-Chan-LandChain-\landchain\backend\.env)
- Example: [backend/.env.example](C:\Users\Vernon\Pictures\HACKPRIX\Hackie-Chan-LandChain-\landchain\backend\.env.example)

Required values:

```env
MONGODB_URI=mongodb+srv://your_actual_mongodb_uri
GEMINI_API_KEY=your_actual_gemini_key
JWT_SECRET=landchain_secret_2026
PORT=5000
```

Important:
- The backend will not start until `MONGODB_URI` is replaced with a real MongoDB Atlas connection string.
- If `GEMINI_API_KEY` is missing, the app falls back to mock AI analysis.

## Install Dependencies

Open a terminal in the repo root and run:

### Backend

```powershell
cd C:\Users\Vernon\Pictures\HACKPRIX\Hackie-Chan-LandChain-\landchain\backend
npm.cmd install
```

### Frontend

```powershell
cd C:\Users\Vernon\Pictures\HACKPRIX\Hackie-Chan-LandChain-\landchain\frontend
npm.cmd install
```

Note for Windows PowerShell:
- Use `npm.cmd` instead of `npm` if PowerShell blocks `npm.ps1`.

## Run the App

Run backend and frontend in separate terminals.

### Start Backend

```powershell
cd C:\Users\Vernon\Pictures\HACKPRIX\Hackie-Chan-LandChain-\landchain\backend
node server.js
```

Expected backend URL:
- `http://localhost:5000`

Health check:
- [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Start Frontend

```powershell
cd C:\Users\Vernon\Pictures\HACKPRIX\Hackie-Chan-LandChain-\landchain\frontend
npm.cmd run dev
```

Expected frontend URL:
- [http://localhost:5173](http://localhost:5173)

## Demo Credentials

- User OTP for signup/login: `123456`
- Registrar portal:
  `admin / admin123`
- Panchayat portal:
  `panchayat / panchayat123`

## Full Demo Workflow

Use two browser tabs for seller and buyer.

### 1. Create seller account

- Open [http://localhost:5173](http://localhost:5173)
- Sign up using any:
  - full name
  - date of birth
  - 12-digit Aadhaar number
  - OTP: `123456`
- Note the generated `userId`

### 2. Create buyer account

- Open a second tab at [http://localhost:5173](http://localhost:5173)
- Sign up as a different user
- Note the buyer `userId`

### 3. Seller starts transfer

- Open `Properties` first to see the seller's currently owned land list
- Open `Tax Payment` and clear any `Unpaid` tax record before attempting transfer
- In seller account, open `Transfer`
- Enter ULPIN: `KA-MNG-142-3B`
- Click `Fetch Land Records`
- Review land records and AI analysis
- Click `Proceed`
- Enter buyer `userId`
- Enter sale price
- Click `Send Agreement to Buyer`

Expected result:
- a property record is materialized for the seller if it does not already exist
- the property appears in the seller `Properties` section with a unique `LAND-XXXXXX` ID
- if any tax record is still unpaid, transfer initiation is blocked and the seller receives a status notification

### 4. Buyer signs agreement

- In buyer account, open `Deed Draft`
- Click `View Full Agreement`
- Click `Agree & Sign Digitally`

### 5. Registrar approves

- Open [http://localhost:5173/registrar](http://localhost:5173/registrar)
- Login with `admin / admin123`
- Approve the transfer

### 6. Panchayat approves

- Open [http://localhost:5173/panchayat](http://localhost:5173/panchayat)
- Login with `panchayat / panchayat123`
- Approve the transfer

### 7. Buyer confirms payment

- Go back to buyer account
- Open `Transfer`
- Find the transfer in `PAYMENT_PENDING`
- Enter any mock UPI transaction ID
- Click `Confirm Payment`

Expected result:
- transfer status becomes `COMPLETED`
- the property disappears from the seller `Properties` section
- the same property appears in the buyer `Properties` section
- the unique `LAND-XXXXXX` ID stays the same while ownership changes

### 8. Verify blockchain

Open:
- [http://localhost:5000/api/blockchain/KA-MNG-142-3B](http://localhost:5000/api/blockchain/KA-MNG-142-3B)
- [http://localhost:5000/api/blockchain/verify/KA-MNG-142-3B](http://localhost:5000/api/blockchain/verify/KA-MNG-142-3B)

Expected result:
- chain entries returned for the ULPIN
- verification returns `valid: true`

## Useful API Endpoints

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`

### Property

- `POST /api/property/fetch`
- `POST /api/property/analyze`

### Transfer

- `POST /api/transfer/initiate`
- `POST /api/transfer/seller-sign`
- `POST /api/transfer/buyer-sign`
- `POST /api/transfer/buyer-decline`
- `POST /api/transfer/registrar-approve`
- `POST /api/transfer/registrar-decline`
- `POST /api/transfer/panchayat-approve`
- `POST /api/transfer/panchayat-decline`
- `POST /api/transfer/payment`
- `GET /api/transfer/:id`
- `GET /api/transfer/user/:userId`
- `GET /api/transfer`

### Notifications

- `GET /api/notifications/:userId`
- `PUT /api/notifications/:id/read`

### Blockchain

- `GET /api/blockchain/:ulpin`
- `GET /api/blockchain/verify/:ulpin`

## Current Notes

- The frontend is verified to render locally on port `5173`.
- The backend requires a real MongoDB Atlas URI before it can start successfully.
- Gemini analysis has a mock fallback, so the transfer flow can still be demonstrated even without a live Gemini key.

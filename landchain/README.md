## LandChain Setup

### Prerequisites

Node.js 18+, MongoDB Atlas account, Gemini API key

### Setup

1. Clone repo
2. `cd landchain/backend && npm install`
3. Copy `.env.example` to `.env`, fill `MONGODB_URI` and `GEMINI_API_KEY`
4. `node server.js`
5. `cd ../frontend && npm install`
6. `npm run dev`

### Demo credentials

- Any Aadhaar number + OTP: `123456`
- Registrar portal: `admin / admin123`
- Panchayat portal: `panchayat / panchayat123`

### Demo flow

1. Sign up as Seller (any aadhaar + `123456`)
2. Sign up as Buyer in another tab
3. Go to Transfer -> enter ULPIN: `KA-MNG-142-3B` -> Fetch
4. Add buyer's userId -> Send Agreement
5. Switch to buyer tab -> Deed Draft -> View -> Sign
6. Open `/registrar` -> approve
7. Open `/panchayat` -> approve
8. Back to seller -> Transfer -> Pay
9. Check `/api/blockchain/KA-MNG-142-3B` for immutable record

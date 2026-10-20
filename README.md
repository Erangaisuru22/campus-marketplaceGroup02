# CampusMarketplaceGroup02
## 📌 Project Overview
**Campus Marketplace** is a clean, student-friendly mobile application built for the students of the **University of Jaffna**. The platform helps students across faculties buy and sell used textbooks, calculators, tech gear, study desks, and campus essentials directly with their peers.

## 🚀 Key Improvements & Features Added

### 1. Student Registration & University Verification
- **Student ID & Faculty Sign Up**: Students register with their Full Name, University Student ID (e.g. `2023/CSC/015`), Faculty, and university email.
- **Role-Based Access Control**: Standard users are registered as verified students. Administrative access is strictly restricted to administrator accounts.

### 2. Search, Category & Price Filtering, and Sorting
- **Instant Search**: Search for items in real time by title or description.
- **Category Chips**: Filter by *All items, Textbooks, Tech, Furniture, Fashion, Stationery, Lab Gear*.
- **Price Range Filters**: One-tap quick filter tags (`<$25`, `$25 - $50`, `$50 - $100`, `$100+`).
- **Sorting**: Sort by *Newest*, *Price: Low to High*, or *Price: High to Low*.

### 3. "Mark as Sold" Seller Lifecycle
- Sellers manage their active and completed items on the **My Items** tab.
- When an item is sold, one tap on **"Mark as Sold"** updates its status across the entire marketplace to a red `Sold` badge.
- Sellers can relist items or delete them if needed.
- Posting new listings is seamlessly accessed via the **"＋ Post Item"** button inside the My Items dashboard.

### 4. Interactive Buyer-Seller Messaging
- Tapping **"Message Seller"** opens direct in-app chat with the listing context header.
- Includes campus quick-reply prompts like *"Is this still available?"* and *"Can you meet at the Science Library?"*.
- Responsive chat interface with timestamps and simulated seller responses.

### 5. Listing Reporting & University Admin Portal
- **Community Moderation**: Students can flag suspicious or scam listings using the **"Report this listing"** dialog.
- **Administrator Dashboard**: Only authenticated administrators can access the portal to review reports, delete violating listings, inspect the student directory, and suspend/ban problematic accounts.

---

## 🗄️ Database Architecture & Security Model

This application supports **MongoDB** (running locally on `mongodb://127.0.0.1:27017/campus_marketplace` via Express REST API on `http://localhost:5001`) as well as **Firebase Cloud Firestore**.

### Collections & Schemas:
1. **`users` Collection**: Stores student profiles, University Registration IDs (`2021/CSC/xxx`), faculty affiliations, passwords, roles (`student` vs `admin`), and suspension status (`isBanned`).
2. **`listings` Collection**: Stores marketplace items, prices, categories, conditions, seller IDs, meetup locations, and statuses (`active` vs `sold`).
3. **`reports` Collection**: Stores moderation flags submitted by students, containing the flagged listing ID, reporter info, violation reason, details, and status (`pending`, `resolved`, `dismissed`).

### Database Security Model:
- **Authentication & Registration**: Every student account requires a verified University of Jaffna email and Student ID.
- **Suspension Enforcement**: Suspended users (`isBanned == true`) are rejected by the database and forbidden from creating listings or posting reports.
- **Role-Based Admin Protection**: The University Admin Portal and moderation endpoints are protected; only verified `admin` accounts can delete listings, review reports, and ban users.

---

## 🛠️ Technologies Used
- **Mobile / Web Frontend**: React Native & Expo SDK 57 (TypeScript)
- **Database Engine**: **MongoDB** (`mongodb://127.0.0.1:27017`)
- **Backend API**: Node.js & Express.js REST API (`backend/server.js` on port `5001`)
- **Alternative Cloud DB**: Google Firebase Cloud Firestore (`firestore.rules`)
- **Styling**: React Native StyleSheet with custom Jaffna University theme

---


## 💻 How to Run Locally

### Prerequisites
- Node.js (v22.13.0 or higher recommended)
- npm
- MongoDB Server running on `127.0.0.1:27017`

### 1. Install Dependencies
```bash
npm install
```

### 2. Start MongoDB Backend Server (Terminal 1)
```bash
npm run server
```
*Connects to `mongodb://127.0.0.1:27017`, creates the `campus_marketplace` database, auto-seeds initial data, and listens on `http://localhost:5001`.*

### 3. Start Expo Web Frontend (Terminal 2)
```bash
npm run web
```
*(Or in Windows PowerShell: `npm.cmd run web`)*  
The app opens in your default browser at `http://localhost:8081`. The Profile tab will show **"🟢 Connected to MongoDB (campus_marketplace @ localhost:27017)"**. Press `F12` to view in mobile responsive view.

### 4. Run on Mobile (Expo Go)
```bash
npm start
```
Scan the QR code in the terminal using the **Expo Go** app on Android or the Camera app on iOS.

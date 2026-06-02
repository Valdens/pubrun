# 🍻 Pub Run Race Tracker

An elegant, mobile-responsive, real-time race tracking application designed for local pub runs. Created to track timing, waypoints, and drinks for the ultimate Seattle loop.

---

## 📖 Project Background

This application was originally designed and built as a custom event tracker for a friend's birthday pub run in Seattle. The 8 waypoints pre-configured in the app represent the exact route walked and run by the party participants that day. 

While the default settings are tailored for that specific route, **the codebase is designed to be highly customizable**. You can easily modify the code to support custom routes, different stops, or completely new locations (see [Customizing the Route](#-customizing-the-route)).

---

## 🚀 Key Features

*   **Live Multi-Tier Leaderboard**: Real-time standings synchronized across all participants using Firebase Firestore.
*   **Challenge Tiers**:
    *   **Full Tryhard (8-Drinks)**: Requires a full drink at every stop, culminating in a prompt for "The Final Ascension" shot.
    *   **4-Drink Sprint**: Compete with a moderate 4-drink quota to be consumed before reaching the final waypoint.
    *   **Casual Pacer**: Focus on the run, route navigation, and social vibes (no drinking requirements).
*   **Active Leg Timing**: Tracks elapsed time between stops (sprint legs) while auto-pausing when you are inside a bar.
*   **Manual Entry Fallback**: Allows participants to manually correct or input split times if a checkpoint button is missed.
*   **Integrated Mapping**: Direct shortcut loading a complete 8-waypoint walking route vector on Google Maps.

---

## 🗺️ The Route (Seattle Loop)

1.  **King Street Bar & Oven** (Start)
2.  **Flatstick Pub**
3.  **Central Saloon**
4.  **McCoy's Firehouse**
5.  **Owl N' Thistle**
6.  **Blarney Stone Pub**
7.  **Jupiter Bar**
8.  **Buckley's in Belltown** (Finish)

---

## 🛠️ Stack & Technologies

*   **Frontend**: React (Vite)
*   **Styling**: Tailwind CSS (CDN-loaded)
*   **Icons**: Lucide React
*   **Database & Auth**: Firebase Firestore & Anonymous Authentication

---

## 📦 Local Setup & Deployment

### 1. Prerequisites
*   Node.js (v18+)
*   Firebase CLI (globally or run via `npx`)

### 2. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 3. Firebase Configuration
Open `src/App.jsx` and update the `firebaseConfig` object with your own Firebase project credentials:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. Firestore Security Rules
To secure your database and prevent users from modifying other participants' times or profiles, deploy these user-locked rules matching the `/artifacts` structure:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only allow users to read and write their own profile details
    match /artifacts/{appId}/users/{userId}/profile/data {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Only allow users to create or modify their own participant standing entry
    match /artifacts/{appId}/public/data/participants/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. Running Locally
Start the development server:
```bash
npm run dev
```

### 6. Deployment
Build and deploy to Firebase Hosting:
```bash
npm run build
npx firebase deploy --only hosting
```

---

## ⚙️ Customizing the Route

To adapt this tracker for your own custom pub run route:

1.  **Update the Map URL**: Open `src/App.jsx` and change the `MAP_URL` constant (around line 49) to point to your custom Google Maps walking directions route.
2.  **Update the Waypoints**: In `src/App.jsx`, modify the `STOPS` array (around line 57) to list your custom stops:
    ```javascript
    const STOPS = [
      { id: 0, name: "Your Custom Bar 1" },
      { id: 1, name: "Your Custom Bar 2" },
      // Add as many stops as you need...
    ];
    ```
    The application will automatically scale the checklist and leg split timing cards based on the length and names defined in this array.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

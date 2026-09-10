# Web Chat App

A modern, real-time web chat application that allows users to register, sign in, and exchange instant messages in private and group conversations.

## Features
- User authentication with email and password registration and login
- Real-time instant messaging powered by Firebase Realtime Database
- Active conversation list with unread message tracking and user search
- Modals for user profile customization and application settings
- Fluid animations and transitions powered by Framer Motion
- Clean, responsive UI styled with Tailwind CSS

## Tech Stack
- React 18
- Vite
- Firebase (Authentication, Realtime Database, Cloud Storage)
- Tailwind CSS & PostCSS
- Framer Motion
- Lucide React (Icons)

## How to Run
1. Navigate to the project folder:
   ```bash
   cd "Internship/Web_Chat_App"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the project root containing your Firebase credentials (use `.env.example` as a template):
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_DATABASE_URL=your_database_url
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
4. Start the local development server:
   ```bash
   npm run dev
   ```
5. Open the URL shown in the terminal (typically `http://localhost:5173`).

## Status
Complete

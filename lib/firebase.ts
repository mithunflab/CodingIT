import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAI, getGenerativeModel, VertexAIBackend } from "firebase/ai";
// import { getAuth } from 'firebase/auth'; // Example: if you need Firebase Auth
// import { getStorage } from 'firebase/storage'; // Example: if you need Firebase Storage
// import { getAnalytics } from 'firebase/analytics'; // Example: if you need Firebase Analytics

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
const generationConfig = {
  max_output_tokens: 200,
  stop_sequences: ["red"],
  temperature: 0.9,
  top_p: 0.1,
  top_k: 16,
};

const ai = getAI(firebaseApp, { backend: new VertexAIBackend() });

const model = getGenerativeModel(ai, { model: "gemini-2.5-flash", generationConfig });


let app: FirebaseApp;
let db: Firestore;
// let auth; // Example
// let storage; // Example
// let analytics; // Example

const requiredEnvVars = [
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
];

const allVarsPresent = requiredEnvVars.every(Boolean);

if (allVarsPresent) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  db = getFirestore(app);
  // auth = getAuth(app); // Example
  // storage = getStorage(app); // Example
  // if (firebaseConfig.measurementId) { // Example for Analytics
  //   analytics = getAnalytics(app);
  // }
} else {
  console.warn(
    'Firebase environment variables are not fully configured. Firebase services will not be available.',
  );
  // Provide dummy/undefined exports or throw an error if Firebase is critical
  // For now, db will be undefined if not configured.
}

export { app, model, db };

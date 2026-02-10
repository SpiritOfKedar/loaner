import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "REDACTED_API_KEY",
    authDomain: "REDACTED_AUTH_DOMAIN",
    projectId: "loaner-425b6",
    storageBucket: "REDACTED_STORAGE_BUCKET",
    messagingSenderId: "REDACTED_SENDER_ID",
    appId: "REDACTED_APP_ID",
    measurementId: "REDACTED_MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth and db for use in the app
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app; 
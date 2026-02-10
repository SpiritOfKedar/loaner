import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDYm3x98rbtCgD7VMfL1S42fOeNOUOxo6c",
    authDomain: "loaner-425b6.firebaseapp.com",
    projectId: "loaner-425b6",
    storageBucket: "loaner-425b6.firebasestorage.app",
    messagingSenderId: "665845958226",
    appId: "1:665845958226:web:af3c96df337a471a8c818b",
    measurementId: "G-VRYB89E3RP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth and db for use in the app
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app; 
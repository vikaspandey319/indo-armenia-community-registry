import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// The browser uses Firebase Authentication only. All Firestore access is handled
// by the authenticated Netlify Function using server-side credentials.
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

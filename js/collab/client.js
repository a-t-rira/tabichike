import { firebaseConfig } from "../firebase-config.js";

const APP_URL = "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
const AUTH_URL = "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
const FIRESTORE_URL = "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
let clientPromise;

export function getClient() {
  if (!clientPromise) {
    clientPromise = initialize().catch((error) => { clientPromise = null; throw error; });
  }
  return clientPromise;
}

async function initialize() {
  const [appSdk, authSdk, firestoreSdk] = await Promise.all([import(APP_URL), import(AUTH_URL), import(FIRESTORE_URL)]);
  const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(firebaseConfig);
  const db = firestoreSdk.initializeFirestore(app, {
    localCache: firestoreSdk.persistentLocalCache({ tabManager: firestoreSdk.persistentMultipleTabManager() }),
  });
  const auth = authSdk.getAuth(app);
  const user = auth.currentUser || (await authSdk.signInAnonymously(auth)).user;
  return { app, auth, db, uid: user.uid, firestore: firestoreSdk };
}

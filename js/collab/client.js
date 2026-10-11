import { firebaseConfig } from "../firebase-config.js";

const APP_URL = "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
const AUTH_URL = "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
const FIRESTORE_URL = "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
let clientPromise;
let corePromise;

export function getClient() {
  if (!clientPromise) {
    clientPromise = initialize().catch((error) => { clientPromise = null; throw error; });
  }
  return clientPromise;
}

async function initialize() {
  const core = await getCore();
  const user = await waitForAnonymousUser(core.auth, core.authSdk);
  return { ...core, uid: user.uid };
}

function getCore() {
  if (!corePromise) corePromise = initializeCore().catch((error) => { corePromise = null; throw error; });
  return corePromise;
}

async function initializeCore() {
  const [appSdk, authSdk, firestoreSdk] = await Promise.all([import(APP_URL), import(AUTH_URL), import(FIRESTORE_URL)]);
  const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(firebaseConfig);
  const db = firestoreSdk.initializeFirestore(app, {
    localCache: firestoreSdk.persistentLocalCache({ tabManager: firestoreSdk.persistentMultipleTabManager() }),
  });
  const auth = authSdk.getAuth(app);
  return { app, auth, db, firestore: firestoreSdk, authSdk };
}

function waitForAnonymousUser(auth, authSdk) {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  return new Promise((resolve, reject) => {
    let unsubscribe = () => {};
    let settled = false;
    let attemptedSignIn = false;
    const finish = (user) => {
      if (settled) return;
      settled = true;
      unsubscribe();
      resolve(user);
    };
    const fail = (error) => {
      if (auth.currentUser) finish(auth.currentUser);
      else if (!settled) { settled = true; unsubscribe(); reject(error); }
    };
    unsubscribe = authSdk.onAuthStateChanged(auth, (user) => {
      if (user) { finish(user); return; }
      if (attemptedSignIn) return;
      attemptedSignIn = true;
      authSdk.signInAnonymously(auth).then((credential) => finish(credential.user), fail);
    }, fail);
  });
}

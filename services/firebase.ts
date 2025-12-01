
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, get, Database } from 'firebase/database';
import { FirebaseConfig, SystemData } from '../types';

let app: FirebaseApp | null = null;
let db: Database | null = null;

export const initializeFirebase = (config: FirebaseConfig) => {
  if (!config || !config.apiKey) return null;
  
  try {
    app = initializeApp(config);
    db = getDatabase(app);
    console.log("Firebase Initialized Successfully");
    return db;
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    return null;
  }
};

// Use a timeout to debounce saves slightly to prevent UI freezing on rapid updates
let saveTimeout: any = null;

export const saveDataToCloud = (data: SystemData) => {
  if (!db) return;
  
  // Debounce save (wait 1s after last change before pushing)
  if (saveTimeout) clearTimeout(saveTimeout);
  
  saveTimeout = setTimeout(() => {
      try {
        console.log("Pushing data to Cloud...");
        const dbRef = ref(db, 'quark_system_data');
        set(dbRef, data).then(() => {
            console.log("Cloud save successful");
        }).catch(err => {
            console.error("Cloud save failed", err);
        });
      } catch (error) {
        console.error("Error saving to cloud:", error);
      }
  }, 1000);
};

export const subscribeToCloudData = (callback: (data: SystemData | null) => void) => {
  if (!db) return () => {};

  const dbRef = ref(db, 'quark_system_data');
  const unsubscribe = onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    callback(data); // Returns null if empty
  });

  return unsubscribe;
};

export const validateConnection = async (): Promise<boolean> => {
    if (!db) return false;
    try {
        const testRef = ref(db, 'connection_test');
        await set(testRef, { timestamp: Date.now(), status: 'OK' });
        return true;
    } catch (e) {
        console.error("Connection Test Failed:", e);
        return false;
    }
}

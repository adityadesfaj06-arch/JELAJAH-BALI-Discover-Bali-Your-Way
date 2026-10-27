import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { SavedPlaceItem, TripPlan, EmergencyContact } from './types';

// Initialize Firebase SDK using provisioned config
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on startup
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testFirestoreConnection();

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Ensure user profile document exists in Firestore
  const userPath = `users/${user.uid}`;
  try {
    const existing = await getDoc(doc(db, 'users', user.uid));
    const role =
      user.email === 'adityadesfaj06@gmail.com' ? 'admin' : 'user';
    if (!existing.exists()) {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Traveler',
        photoURL: user.photoURL || '',
        preferredLanguage: 'id',
        preferredCurrency: 'IDR',
        role,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
  return user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged };

export async function savePlaceToCloud(item: SavedPlaceItem): Promise<void> {
  const path = `savedPlaces/${item.id}`;
  try {
    await setDoc(doc(db, 'savedPlaces', item.id), item);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeSavedPlaceFromCloud(id: string): Promise<void> {
  const path = `savedPlaces/${id}`;
  try {
    await deleteDoc(doc(db, 'savedPlaces', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveTripToCloud(trip: TripPlan): Promise<void> {
  const path = `trips/${trip.id}`;
  try {
    await setDoc(doc(db, 'trips', trip.id), trip);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTripFromCloud(id: string): Promise<void> {
  const path = `trips/${id}`;
  try {
    await deleteDoc(doc(db, 'trips', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveEmergencyContactToCloud(
  contact: EmergencyContact
): Promise<void> {
  const path = `emergencyContacts/${contact.id}`;
  try {
    await setDoc(doc(db, 'emergencyContacts', contact.id), contact);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteEmergencyContactFromCloud(
  id: string
): Promise<void> {
  const path = `emergencyContacts/${id}`;
  try {
    await deleteDoc(doc(db, 'emergencyContacts', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeUserSavedPlaces(
  uid: string,
  callback: (places: SavedPlaceItem[]) => void
) {
  const q = query(collection(db, 'savedPlaces'), where('uid', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map(
        (d) => d.data() as SavedPlaceItem
      );
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'savedPlaces');
    }
  );
}

export function subscribeUserTrips(
  uid: string,
  callback: (trips: TripPlan[]) => void
) {
  const q = query(collection(db, 'trips'), where('uid', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as TripPlan);
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'trips');
    }
  );
}

export function subscribeUserEmergencyContacts(
  uid: string,
  callback: (contacts: EmergencyContact[]) => void
) {
  const q = query(
    collection(db, 'emergencyContacts'),
    where('uid', '==', uid)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map(
        (d) => d.data() as EmergencyContact
      );
      callback(items);
    },
    (error) => {
      handleFirestoreError(
        error,
        OperationType.LIST,
        'emergencyContacts'
      );
    }
  );
}

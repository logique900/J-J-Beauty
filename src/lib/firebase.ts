import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, collection, getDocs, writeBatch, query, where, serverTimestamp, orderBy } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { mockProducts } from '../data/mockProducts';
import { mockCategories, mockBrands } from '../data/navigation';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Seed and fetch categories
export async function getOrSeedCategories() {
  const categoriesRef = collection(db, 'categories');
  try {
    // 1. Try public query (Active only) - Guaranteed to work for everyone if status matches
    const qPublic = query(categoriesRef, where('status', '==', 'Actif'), orderBy('position', 'asc'));
    const snapPublic = await getDocs(qPublic);
    
    if (!snapPublic.empty) {
      return snapPublic.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // 2. If empty, maybe we are Admin and need to see Drafts or Seed
    const adminEmails = ['logique900@gmail.com', 'admin@j-jbeauty.tn'];
    if (auth.currentUser) {
      try {
        const snapAdmin = await getDocs(query(categoriesRef, orderBy('position', 'asc')));
        if (!snapAdmin.empty) {
          return snapAdmin.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        // 3. Still empty? Try Seeding if Admin email
        if (adminEmails.includes(auth.currentUser.email || '')) {
          console.log("Admin detected: Seeding categories...");
          const batch = writeBatch(db);
          for (let i = 0; i < mockCategories.length; i++) {
              const cat = mockCategories[i];
              const docRef = doc(categoriesRef, cat.id);
              batch.set(docRef, {
                  ...cat,
                  status: cat.status || 'Actif',
                  position: i + 1,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
              });
          }
          await batch.commit();
        }
      } catch (adminErr) {
        console.warn("Admin fetch/seed fail:", adminErr);
      }
    }
    
    return mockCategories;
  } catch (error: any) {
    console.error("Categories fetch error:", error);
    return mockCategories;
  }
}

export async function getOrSeedProducts() {
  const productsRef = collection(db, 'products');
  try {
    // 1. Try public query
    const qPublic = query(productsRef, where('status', '==', 'active'));
    const snapPublic = await getDocs(qPublic);

    if (!snapPublic.empty) {
      const data = snapPublic.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (data.some((p: any) => p.name === 'Veste Minimaliste en Laine')) return mockProducts;
      return data;
    }

    // 2. Try admin fetch or seed
    if (auth.currentUser) {
      try {
        const snapAdmin = await getDocs(productsRef);
        if (!snapAdmin.empty) {
          return snapAdmin.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        if (adminEmails.includes(auth.currentUser.email || '')) {
          console.log("Admin detected: Seeding products...");
          const batch = writeBatch(db);
          for (const prod of mockProducts) {
            const docRef = doc(productsRef, prod.id);
            batch.set(docRef, {
              ...prod,
              status: prod.status || 'active',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
          await batch.commit();
        }
      } catch (adminErr) {
        console.warn("Admin products fetch/seed fail:", adminErr);
      }
    }
    
    return mockProducts;
  } catch (error: any) {
    console.error("Products fetch error:", error);
    return mockProducts;
  }
}

// Connectivity testing function
export async function testConnection() {
  try {
    // Attempting to read a non-existent document in a closed collection
    // to verify rules engine is alive.
    await getDocFromServer(doc(db, 'system_config', 'status'));
  } catch (error: any) {
    if (error.message?.includes('the client is offline')) {
      console.error("Firebase: Client is offline.");
    } else if (error.message?.includes('Missing or insufficient permissions')) {
      // This is EXPECTED if not admin, as system_config is restricted
      console.log("Firebase: Connected (authenticated/public path verified).");
    } else {
      console.warn("Firebase connection test result:", error.message);
    }
  }
}

export async function getOrSeedBrands() {
  const brandsRef = collection(db, 'brands');
  try {
    // 1. Try public query
    const qPublic = query(brandsRef, where('status', '==', 'Actif'));
    const snapPublic = await getDocs(qPublic);
    
    if (!snapPublic.empty) {
      return snapPublic.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // 2. Admin fetch/seed
    if (auth.currentUser) {
      try {
        const snapAdmin = await getDocs(brandsRef);
        if (!snapAdmin.empty) {
          return snapAdmin.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        if (adminEmails.includes(auth.currentUser.email || '')) {
          console.log("Admin detected: Seeding brands...");
          const batch = writeBatch(db);
          for (const brand of mockBrands) {
            const docRef = doc(brandsRef, brand.id || brand.name.toLowerCase().replace(/\s+/g, '-'));
            batch.set(docRef, {
              ...brand,
              status: 'Actif',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
          await batch.commit();
        }
      } catch (adminErr) {
        console.warn("Admin brands fetch/seed fail:", adminErr);
      }
    }

    return mockBrands;
  } catch (error: any) {
    console.error("Brands fetch error:", error);
    return mockBrands;
  }
}

// Error handling helper
export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

testConnection();

export function handleFirestoreError(error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null = null) {
  const currentUser = auth.currentUser;
  
  if (error?.message?.includes('Missing or insufficient permissions')) {
    const errorInfo: FirestoreErrorInfo = {
      error: 'Missing or insufficient permissions',
      operationType,
      path,
      authInfo: {
        userId: currentUser?.uid || '',
        email: currentUser?.email || '',
        emailVerified: currentUser?.emailVerified || false,
        isAnonymous: currentUser?.isAnonymous || false,
        providerInfo: currentUser?.providerData?.map(p => ({
          providerId: p.providerId,
          displayName: p.displayName || '',
          email: p.email || ''
        })) || []
      }
    };
    throw new Error(JSON.stringify(errorInfo));
  }
  throw error;
}

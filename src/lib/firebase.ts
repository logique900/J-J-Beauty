import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, collection, getDocs, writeBatch, query, where, serverTimestamp, orderBy } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import { mockProducts } from '../data/mockProducts';
import { mockCategories, mockBrands, mockCollections } from '../data/navigation';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

export const adminEmails = ['logique900@gmail.com', 'admin@j-jbeauty.tn'];

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

export async function getOrSeedCollections() {
  const collectionsRef = collection(db, 'collections');
  try {
    // 1. Try public query First (safe for anyone)
    const qPublic = query(collectionsRef, where('status', '==', 'Actif'), orderBy('name', 'asc'));
    const snapPublic = await getDocs(qPublic);
    
    if (!snapPublic.empty) {
      return snapPublic.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // 2. If empty and admin, seed
    if (auth.currentUser && adminEmails.includes(auth.currentUser.email || '')) {
      console.log("Admin detected: Seeding collections...");
      const batch = writeBatch(db);
      for (const col of mockCollections) {
        const docRef = doc(collectionsRef, col.id);
        batch.set(docRef, {
          ...col,
          status: 'Actif',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      await batch.commit();
    }

    return mockCollections;
  } catch (error: any) {
    console.error("Collections fetch error:", error);
    return mockCollections;
  }
}

export async function getOrSeedHeroSlides() {
  const slidesRef = collection(db, 'hero-slides');
  const defaultSlides = [
    {
      id: 'slide-1',
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=2000',
      title: 'Bienvenue chez J&J Beauty',
      subtitle: 'L\'excellence cosmétique à votre portée. Révélez votre beauté naturelle avec notre collection exclusive.',
      cta: 'Découvrir la collection',
      position: 1,
      status: 'active'
    },
    {
      id: 'slide-2',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=2000',
      title: 'Nouveautés Maquillage',
      subtitle: 'Des teintes éclatantes et des textures inédites pour sublimer votre visage au quotidien.',
      cta: 'Voir les nouveautés',
      position: 2,
      status: 'active'
    },
    {
      id: 'slide-3',
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=2000',
      title: 'Rituels de Soin',
      subtitle: 'Prenez du temps pour vous avec notre gamme de soins relaxants, hydratants et purifiants.',
      cta: 'Explorer les soins',
      position: 3,
      status: 'active'
    }
  ];

  try {
    const qPublic = query(slidesRef, where('status', '==', 'active'), orderBy('position', 'asc'));
    const snapPublic = await getDocs(qPublic);
    
    if (!snapPublic.empty) {
      return snapPublic.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    if (auth.currentUser && adminEmails.includes(auth.currentUser.email || '')) {
      console.log("Admin detected: Seeding hero slides...");
      const batch = writeBatch(db);
      for (const slide of defaultSlides) {
        const docRef = doc(slidesRef, slide.id);
        batch.set(docRef, {
          ...slide,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      await batch.commit();
      const snapAgain = await getDocs(qPublic);
      return snapAgain.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    return defaultSlides;
  } catch (error: any) {
    console.error("Hero slides fetch error:", error);
    return defaultSlides;
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

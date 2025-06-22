// lib/firebase.ts
import { initializeApp, FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  Firestore, 
  collection, 
  getDocs, 
  query, 
  orderBy,
  Query,
  DocumentData,
  QueryDocumentSnapshot,
  doc,
  updateDoc,
  setDoc,
  addDoc,
  deleteDoc,
  writeBatch
} from "firebase/firestore";
import { Manifestation, Order, Client, ParameterItem, DynamicFieldMapping, User } from './types';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const;

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
const db: Firestore = getFirestore(app);

// Generic function to fetch and transform Firestore documents
async function fetchCollection<T extends { id: string }>(
  collectionName: string,
  orderByField: string,
  transform: (doc: QueryDocumentSnapshot<DocumentData>) => T
): Promise<T[]> {
  try {
    const collectionRef = collection(db, collectionName);
    const q: Query<DocumentData> = query(collectionRef, orderBy(orderByField, "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(transform);
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    throw new Error(`Failed to fetch ${collectionName}`);
  }
}

// Collection-specific fetch functions
export async function fetchClients(): Promise<Client[]> {
  return fetchCollection<Client>(
    "clients",
    "registrationDate",
    (doc) => ({ id: doc.id, ...(doc.data() as Omit<Client, "id">) })
  );
}

export async function fetchOrders(): Promise<Order[]> {
  return fetchCollection<Order>(
    "orders",
    "date",
    (doc) => ({ id: doc.id, ...(doc.data() as Omit<Order, "id">) })
  );
}

export async function fetchManifestations(): Promise<Manifestation[]> {
  return fetchCollection<Manifestation>(
    "manifestations",
    "openingDate",
    (doc) => ({ id: doc.id, ...(doc.data() as Omit<Manifestation, "id">) })
  );
}

export async function fetchParameterItems(): Promise<ParameterItem[]> {
  return fetchCollection<ParameterItem>(
    "parameterItems",
    "id",
    (doc) => ({ id: doc.id, ...(doc.data() as Omit<ParameterItem, "id">) })
  );
}

export async function fetchDynamicFieldMappings(): Promise<DynamicFieldMapping[]> {
  return fetchCollection<DynamicFieldMapping>(
    "dynamicFieldMappings",
    "id",
    (doc) => ({ id: doc.id, ...(doc.data() as Omit<DynamicFieldMapping, "id">) })
  );
}

export async function fetchUsers(): Promise<User[]> {
  return fetchCollection<User>(
    "users",
    "id",
    (doc) => ({ id: doc.id, ...(doc.data() as Omit<User, "id">) })
  );
}

// Update functions
export async function updateManifestation(manifestationId: string, data: Partial<Manifestation>): Promise<void> {
  try {
    const docRef = doc(db, "manifestations", manifestationId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating manifestation:', error);
    throw new Error('Failed to update manifestation');
  }
}

export async function createManifestation(data: Omit<Manifestation, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "manifestations"), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating manifestation:', error);
    throw new Error('Failed to create manifestation');
  }
}

export async function updateClient(clientId: string, data: Partial<Client>): Promise<void> {
  try {
    const docRef = doc(db, "clients", clientId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating client:', error);
    throw new Error('Failed to update client');
  }
}

export async function createClient(data: Omit<Client, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "clients"), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating client:', error);
    throw new Error('Failed to create client');
  }
}

export async function updateOrder(orderId: string, data: Partial<Order>): Promise<void> {
  try {
    const docRef = doc(db, "orders", orderId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating order:', error);
    throw new Error('Failed to update order');
  }
}

export async function createOrder(data: Omit<Order, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "orders"), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('Failed to create order');
  }
}

export async function updateParameterItem(itemId: string, data: Partial<ParameterItem>): Promise<void> {
  try {
    const docRef = doc(db, "parameterItems", itemId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating parameter item:', error);
    throw new Error('Failed to update parameter item');
  }
}

export async function createParameterItem(data: Omit<ParameterItem, "id">): Promise<string> {
  try {
    const customId = `param-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const docRef = doc(db, "parameterItems", customId);
    await setDoc(docRef, {
      ...data,
      id: customId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return customId;
  } catch (error) {
    console.error('Error creating parameter item:', error);
    throw new Error('Failed to create parameter item');
  }
}

export async function deleteParameterItem(itemId: string): Promise<void> {
  try {
    const docRef = doc(db, "parameterItems", itemId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting parameter item:', error);
    throw new Error('Failed to delete parameter item');
  }
}

export async function createDynamicFieldMapping(data: Omit<DynamicFieldMapping, "id">): Promise<string> {
  try {
    const customId = `mapping-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const docRef = doc(db, "dynamicFieldMappings", customId);
    await setDoc(docRef, {
      ...data,
      id: customId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return customId;
  } catch (error) {
    console.error('Error creating dynamic field mapping:', error);
    throw new Error('Failed to create dynamic field mapping');
  }
}

export async function updateDynamicFieldMapping(mappingId: string, data: Partial<DynamicFieldMapping>): Promise<void> {
  try {
    const docRef = doc(db, "dynamicFieldMappings", mappingId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating dynamic field mapping:', error);
    throw new Error('Failed to update dynamic field mapping');
  }
}

export async function deleteDynamicFieldMapping(mappingId: string): Promise<void> {
  try {
    const docRef = doc(db, "dynamicFieldMappings", mappingId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting dynamic field mapping:', error);
    throw new Error('Failed to delete dynamic field mapping');
  }
}

export async function updateUser(userId: string, data: Partial<User>): Promise<void> {
  try {
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error('Failed to update user');
  }
}

export async function createUser(data: Omit<User, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "users"), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }
}

// Batch operations for multiple updates
export async function batchUpdateManifestations(updates: Array<{ id: string; data: Partial<Manifestation> }>): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    updates.forEach(({ id, data }) => {
      const docRef = doc(db, "manifestations", id);
      batch.update(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error batch updating manifestations:', error);
    throw new Error('Failed to batch update manifestations');
  }
}

// Delete functions
export async function deleteManifestation(manifestationId: string): Promise<void> {
  try {
    const docRef = doc(db, "manifestations", manifestationId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting manifestation:', error);
    throw new Error('Failed to delete manifestation');
  }
}

export async function deleteClient(clientId: string): Promise<void> {
  try {
    const docRef = doc(db, "clients", clientId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting client:', error);
    throw new Error('Failed to delete client');
  }
}

export async function deleteOrder(orderId: string): Promise<void> {
  try {
    const docRef = doc(db, "orders", orderId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting order:', error);
    throw new Error('Failed to delete order');
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    const docRef = doc(db, "users", userId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
}

// Export Firestore instance for direct database access if needed
export { db };
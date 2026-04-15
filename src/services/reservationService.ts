import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Reservation {
  id?: string;
  customer_info: {
    name: string;
    email: string;
    phone: string;
  };
  date: string;
  time: string;
  guests: number;
  special_requests: string;
  status: ReservationStatus;
  created_at: any;
  updated_at: any;
}

const RESERVATIONS_COLLECTION = 'reservations';

export function subscribeToReservations(
  callback: (reservations: Reservation[]) => void, 
  onError?: (error: any) => void
) {
  const q = query(
    collection(db, RESERVATIONS_COLLECTION),
    orderBy('created_at', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const reservations: Reservation[] = [];
    snapshot.forEach((doc) => {
      reservations.push({ id: doc.id, ...doc.data() } as Reservation);
    });
    callback(reservations);
  }, (error) => {
    console.error("Error subscribing to reservations:", error);
    if (onError) onError(error);
  });
}

export async function updateReservationStatus(reservationId: string, status: ReservationStatus) {
  const docRef = doc(db, RESERVATIONS_COLLECTION, reservationId);
  await updateDoc(docRef, {
    status,
    updated_at: new Date()
  });
}

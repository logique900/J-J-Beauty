import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, updateDoc, doc, limit, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  createdAt: any;
}

/**
 * Send an in-app notification
 */
export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType = 'info',
  link?: string
) {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type,
      read: false,
      link: link || '',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

/**
 * Subscribe to notifications for a user OR admin
 */
export function subscribeToNotifications(userId: string, isAdmin: boolean, callback: (notifications: AppNotification[]) => void) {
  if (!userId) return () => {};

  // If admin, we also want to see notifications targeted at 'admin'
  let q;
  if (isAdmin) {
    q = query(
      collection(db, 'notifications'),
      where('userId', 'in', [userId, 'admin']),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  } else {
    q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AppNotification[];
    callback(notifications);
  }, (err) => console.error("Notifications error:", err));
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string) {
  try {
    const docRef = doc(db, 'notifications', notificationId);
    await updateDoc(docRef, { read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(notifications: AppNotification[]) {
  const unread = notifications.filter(n => !n.read);
  return Promise.all(unread.map(n => markAsRead(n.id)));
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const docRef = doc(db, 'notifications', notificationId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting notification:', error);
  }
}

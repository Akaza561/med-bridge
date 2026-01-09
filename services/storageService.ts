
import { MedicineDetails } from "../types";

const STORAGE_KEY = 'MEDSCAN_STORAGE';
const WISHLIST_KEY = 'MEDSCAN_WISHLIST';

const INITIAL_MEDICINES: (MedicineDetails & { id: string })[] = [
  {
    medicineName: "Amoxicillin 500mg",
    expiryDate: "12/2025",
    dosage: "1 pill every 8 hours",
    id: "MED-101",
    imageUrls: ["https://plus.unsplash.com/premium_photo-1673327144270-48efffda64c0?q=80&w=800&auto=format&fit=crop"]
  },
  {
    medicineName: "Lisinopril 10mg",
    expiryDate: "08/2024",
    dosage: "1 pill daily",
    id: "MED-102",
    imageUrls: ["https://images.unsplash.com/photo-1585435557343-3b092031a831?q=80&w=800&auto=format&fit=crop"]
  }
];

export const getMedicines = (): (MedicineDetails & { id: string })[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MEDICINES));
    return INITIAL_MEDICINES;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_MEDICINES;
  }
};

export const addMedicine = (item: MedicineDetails & { id: string }) => {
  const current = getMedicines();
  const updated = [item, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const buyMedicine = (id: string) => {
  const current = getMedicines();
  const updated = current.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

// Wishlist Logic
export const getWishlist = (username: string): string[] => {
  const stored = localStorage.getItem(`${WISHLIST_KEY}_${username}`);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const toggleWishlist = (username: string, id: string): string[] => {
  const current = getWishlist(username);
  const exists = current.includes(id);
  const updated = exists ? current.filter(item => item !== id) : [...current, id];
  localStorage.setItem(`${WISHLIST_KEY}_${username}`, JSON.stringify(updated));
  return updated;
};

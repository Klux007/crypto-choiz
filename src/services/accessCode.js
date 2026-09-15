import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function verifyAccessCode(code) {
  try {
    const ref = doc(db, 'access_codes', code.trim().toUpperCase());
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return { valid: false, reason: 'Code inconnu' };
    }

    const data = snap.data();
    if (data.active !== true) {
      return { valid: false, reason: 'Code désactivé' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, reason: 'Erreur réseau — réessaie plus tard' };
  }
}
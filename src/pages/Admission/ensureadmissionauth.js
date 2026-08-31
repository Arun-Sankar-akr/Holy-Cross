import { auth } from '../../service/firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

export function ensureAdmission() {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(
            auth,
            async (user) => {
                unsubscribe();
                if (user) {
                    resolve(user);
                    return;
                }
                try {
                    const cred = await signInAnonymously(auth);
                    resolve(cred.user);
                } catch (err) {
                    reject(err);
                }
            },
            (err) => {
                unsubscribe();
                reject(err);
            }
        );
    });
}
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../../service/firebase';


export function ensureAdmission() {
    return new Promise((resolve, reject) => {
        let unsubscribe = null;
        let resolved = false;

        const finish = (callback, value) => {
            if (resolved) return;

            resolved = true;

            if (unsubscribe) {
                unsubscribe();
                unsubscribe = null;
            }

            callback(value);
        };

        unsubscribe = onAuthStateChanged(
            auth,
            async (user) => {
                if (user) {
                    finish(resolve, user);
                    return;
                }

                try {
                    const credential = await signInAnonymously(auth);

                    if (credential?.user) {
                        finish(resolve, credential.user);
                    } else {
                        finish(
                            reject,
                            new Error(
                                'Firebase anonymous authentication did not return a user.'
                            )
                        );
                    }
                } catch (error) {
                    console.error(
                        'Firebase anonymous authentication failed:',
                        error
                    );

                    finish(reject, error);
                }
            },
            (error) => {
                console.error(
                    'Firebase authentication state error:',
                    error
                );

                finish(reject, error);
            }
        );
    });
}

export default ensureAdmission;


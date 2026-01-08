import { auth } from "./client";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

export function signUp(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logOut() {
  return signOut(auth);
}

export function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  // Optionally you can set custom parameters
  // provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(auth, provider);
}

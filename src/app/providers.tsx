"use client";

import { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { setAuthState } from "@/lib/authSlice";
import { logOut } from "@/lib/firebase/auth";
import { store } from "@/lib/store";
import { useAppDispatch } from "@/lib/storeHooks";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

function AuthListener({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUserId = useRef<string | null>(null);
  const resetTimerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      dispatch(
        setAuthState(
          nextUser
            ? {
                uid: nextUser.uid,
                email: nextUser.email,
                displayName: nextUser.displayName,
                photoURL: nextUser.photoURL,
              }
            : null
        )
      );

      lastUserId.current = nextUser?.uid ?? null;

      if (!nextUser && inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }

      if (nextUser && resetTimerRef.current) {
        resetTimerRef.current();
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  useEffect(() => {
    const resetTimer = () => {
      if (!lastUserId.current) return;
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      inactivityTimer.current = setTimeout(() => {
        logOut();
      }, INACTIVITY_TIMEOUT_MS);
    };

    resetTimerRef.current = resetTimer;

    const events = ["mousemove", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      resetTimerRef.current = null;
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
    };
  }, []);

  return children;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthListener>{children}</AuthListener>
    </Provider>
  );
}

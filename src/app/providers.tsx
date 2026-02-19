"use client";

import { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { setAuthState } from "@/lib/store/slices/authSlice";
import { fetchBinders, resetBinders } from "@/lib/store/slices/bindersSlice";
import { logOut } from "@/lib/auth/auth";
import { store } from "@/lib/store/store";
import { useAppDispatch } from "@/lib/store/storeHooks";
import { supabase } from "@/lib/supabase/client";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

function AuthListener({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUserId = useRef<string | null>(null);
  const resetTimerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const nextUser = session?.user ?? null;

      dispatch(
        setAuthState(
          nextUser
            ? {
                uid: nextUser.id,
                email: nextUser.email ?? null,
                displayName:
                  nextUser.user_metadata?.full_name ??
                  nextUser.user_metadata?.name ??
                  null,
                photoURL: nextUser.user_metadata?.avatar_url ?? null,
              }
            : null
        )
      );

      lastUserId.current = nextUser?.id ?? null;
      if (nextUser) {
        dispatch(fetchBinders());
      } else {
        dispatch(resetBinders());
      }

      if (!nextUser && inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }

      if (nextUser && resetTimerRef.current) {
        resetTimerRef.current();
      }
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      const nextUser = session?.user ?? null;
      dispatch(
        setAuthState(
          nextUser
            ? {
                uid: nextUser.id,
                email: nextUser.email ?? null,
                displayName:
                  nextUser.user_metadata?.full_name ??
                  nextUser.user_metadata?.name ??
                  null,
                photoURL: nextUser.user_metadata?.avatar_url ?? null,
              }
            : null
        )
      );

      lastUserId.current = nextUser?.id ?? null;
      if (nextUser) {
        dispatch(fetchBinders());
      } else {
        dispatch(resetBinders());
      }

      if (!nextUser && inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }

      if (nextUser && resetTimerRef.current) {
        resetTimerRef.current();
      }
    });

    return () => subscription.unsubscribe();
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

"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { setAuthState } from "@/lib/store/slices/authSlice";
import { fetchBinders, resetBinders } from "@/lib/store/slices/bindersSlice";
import { store } from "@/lib/store/store";
import { useAppDispatch } from "@/lib/store/storeHooks";
import { supabase } from "@/lib/supabase/client";

function AuthListener({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

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

      if (nextUser) {
        dispatch(fetchBinders());
      } else {
        dispatch(resetBinders());
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

      if (nextUser) {
        dispatch(fetchBinders());
      } else {
        dispatch(resetBinders());
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  return children;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthListener>{children}</AuthListener>
    </Provider>
  );
}

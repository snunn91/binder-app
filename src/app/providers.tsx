"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { setAuthState } from "@/lib/authSlice";
import { store } from "@/lib/store";
import { useAppDispatch } from "@/lib/storeHooks";

function AuthListener({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

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
    });

    return () => unsubscribe();
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

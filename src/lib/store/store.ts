import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/lib/store/slices/authSlice";
import bindersReducer from "@/lib/store/slices/bindersSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    binders: bindersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

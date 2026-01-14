"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createBinderDoc,
  fetchBindersForUser,
  type BinderDraft,
  type BinderItem,
} from "@/lib/firebase/services/binderService";
import type { RootState } from "@/lib/store/store";

type BindersState = {
  creating: boolean;
  error: string | null;
  lastCreatedId: string | null;
  items: BinderItem[];
};

const initialState: BindersState = {
  creating: false,
  error: null,
  lastCreatedId: null,
  items: [],
};

export const fetchBinders = createAsyncThunk<
  BinderItem[],
  void,
  { state: RootState; rejectValue: string }
>("binders/fetchBinders", async (_, { getState, rejectWithValue }) => {
  const userId = getState().auth.user?.uid;
  if (!userId) {
    return rejectWithValue("User not authenticated");
  }

  return fetchBindersForUser(userId);
});

export const createBinder = createAsyncThunk<
  BinderItem,
  BinderDraft,
  { state: RootState; rejectValue: string }
>("binders/createBinder", async (payload, { getState, rejectWithValue }) => {
  const userId = getState().auth.user?.uid;
  if (!userId) {
    return rejectWithValue("User not authenticated");
  }

  return createBinderDoc(userId, payload);
});

const bindersSlice = createSlice({
  name: "binders",
  initialState,
  reducers: {
    resetBinders(state) {
      state.items = [];
      state.error = null;
      state.lastCreatedId = null;
      state.creating = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBinder.pending, (state) => {
        state.creating = true;
        state.error = null;
        state.lastCreatedId = null;
      })
      .addCase(createBinder.fulfilled, (state, action) => {
        state.creating = false;
        state.lastCreatedId = action.payload.id;
        state.items.unshift(action.payload);
      })
      .addCase(createBinder.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload ?? "Failed to create binder";
      })
      .addCase(fetchBinders.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchBinders.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(fetchBinders.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to load binders";
      });
  },
});

export const { resetBinders } = bindersSlice.actions;
export default bindersSlice.reducer;

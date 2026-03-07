import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../types/chat";

type UsersState = {
  list: User[];
};

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function dedupeUsers(users: User[]) {
  const seen = new Set<string>();
  const unique: User[] = [];

  for (const user of users) {
    if (!user || typeof user.key !== "string") {
      continue;
    }
    const normalized = normalizeKey(user.key);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    unique.push({ key: user.key.trim() });
  }

  return unique;
}

const initialState: UsersState = {
  list: [],
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setUsers(state, action: PayloadAction<User[]>) {
      state.list = dedupeUsers(action.payload);
    },
    userJoined(state, action: PayloadAction<User>) {
      const key = typeof action.payload.key === "string" ? action.payload.key.trim() : "";
      if (!key) {
        return;
      }
      const normalized = normalizeKey(key);
      const exists = state.list.some((user) => normalizeKey(user.key) === normalized);
      if (!exists) {
        state.list.push({ key });
      }
    },
    userLeft(state, action: PayloadAction<string>) {
      const normalized = normalizeKey(action.payload);
      state.list = state.list.filter((user) => normalizeKey(user.key) !== normalized);
    },
    resetUsers(state) {
      state.list = [];
    },
  },
});

export const { setUsers, userJoined, userLeft, resetUsers } = usersSlice.actions;
export default usersSlice.reducer;

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import studyGroupsReducer from './slices/studyGroupsSlice';
import messagesReducer from './slices/messagesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    studyGroups: studyGroupsReducer,
    messages: messagesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

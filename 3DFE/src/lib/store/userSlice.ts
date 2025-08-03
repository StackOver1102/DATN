import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../types';
import { apiUtils } from '../apiUtils';

// Define the user state interface
interface UserState {
  profile: User | null;
  isLoading: boolean;
  error: string | null;
  hasLoadedProfile: boolean;
  sessionLoaded: boolean;
}

// Initial state
const initialState: UserState = {
  profile: null,
  isLoading: false,
  error: null,
  hasLoadedProfile: false,
  sessionLoaded: false,
};

// Async thunk for fetching user profile
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (token: string | undefined, { rejectWithValue }) => {
    try {
      const response = await apiUtils.getUserProfile(token);
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue(response.message || 'Failed to load profile');
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An error occurred');
    }
  }
);

// User slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<User | null>) => {
      state.profile = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setHasLoadedProfile: (state, action: PayloadAction<boolean>) => {
      state.hasLoadedProfile = action.payload;
    },
    setSessionLoaded: (state, action: PayloadAction<boolean>) => {
      state.sessionLoaded = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.hasLoadedProfile = true;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions and reducer
export const { 
  setProfile, 
  setLoading, 
  setError, 
  setHasLoadedProfile,
  setSessionLoaded
} = userSlice.actions;
export default userSlice.reducer;
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '../types';
import { useFetchData, useUpdateData } from '../hooks/useApi';

// Interface cho dữ liệu người dùng được lưu trong store
interface UserState {
  profile: User | null;
  isLoading: boolean;
  error: string | null;
  hasLoadedProfile: boolean;
  
  setProfile: (profile: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasLoadedProfile: (loaded: boolean) => void;
}

// Interface cho dữ liệu cập nhật profile
interface UpdateProfileData extends Partial<User> {
  userId: string;
}

// Interface cho dữ liệu đổi mật khẩu
interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

// Store chính để lưu trữ thông tin người dùng
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      isLoading: false,
      error: null,
      hasLoadedProfile: false,
      
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setHasLoadedProfile: (hasLoadedProfile) => set({ hasLoadedProfile })
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ 
        profile: state.profile,
        hasLoadedProfile: state.hasLoadedProfile 
      }),
    }
  )
);

// Hook để sử dụng trong components kết hợp các hook React Query
export function useUserStoreWithAPI() {
  const { 
    profile, 
    isLoading, 
    error, 
    hasLoadedProfile, 
    setProfile, 
    setLoading, 
    setError, 
    setHasLoadedProfile 
  } = useUserStore();
  
  // Dùng hook useFetchData để lấy thông tin profile
  const { 
    data, 
    isLoading: isLoadingProfile, 
    error: profileError, 
    refetch: refetchProfileInternal 
  } = useFetchData<User>(
    'users/profile',
    ['userProfile'],
    {
      enabled: false, // Không tự động fetch khi mount, chỉ khi refetchProfile được gọi
      onSuccess: (userData) => {
        // Chỉ cập nhật state nếu dữ liệu thực sự thay đổi hoặc chưa được tải
        if (!profile || JSON.stringify(profile) !== JSON.stringify(userData)) {
          setProfile(userData);
        }
        if (!hasLoadedProfile) {
          setHasLoadedProfile(true);
        }
      },
      onError: (err) => {
        setError(err.message);
      },
      staleTime: 1000 * 60 * 5, // Giữ dữ liệu "mới" trong 5 phút
      refetchInterval: false, // Không tự động refetch
    }
  );
  
  // Wrapper cho refetchProfile để kiểm tra xem đã load chưa
  const refetchProfile = async () => {
    // Tránh set loading nếu đang loading
    if (!isLoading) {
      setLoading(true);
    }
    
    try {
      const result = await refetchProfileInternal();
      if (result.isSuccess && result.data) {
        // Chỉ cập nhật state nếu dữ liệu thực sự thay đổi hoặc chưa được tải
        if (!profile || JSON.stringify(profile) !== JSON.stringify(result.data)) {
          setProfile(result.data);
        }
        if (!hasLoadedProfile) {
          setHasLoadedProfile(true);
        }
      }
      return result;
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      throw error;
    } finally {
      // Tránh set loading false nếu đã có request khác đang loading
      if (isLoading) {
        setLoading(false);
      }
    }
  };
  
  // Dùng hook useUpdateData để cập nhật profile
  const updateProfileMutation = useUpdateData<User, UpdateProfileData>(
    'users',
    ['userProfile'],
    {
      onSuccess: (updatedData) => {
        // Chỉ cập nhật state nếu dữ liệu thực sự thay đổi
        if (!profile || JSON.stringify(profile) !== JSON.stringify(updatedData)) {
          setProfile(updatedData);
        }
      },
      onError: (err) => {
        setError(err.message);
      }
    }
  );
  
  // Dùng hook useUpdateData để đổi mật khẩu
  const changePasswordMutation = useUpdateData<{ message: string }, ChangePasswordData>(
    'users/change-password',
    ['userPassword'],
    {
      onError: (err) => {
        setError(err.message);
      }
    }
  );
  
  return {
    profile,
    hasLoadedProfile,
    isLoading: isLoadingProfile || updateProfileMutation.isPending || changePasswordMutation.isPending || isLoading,
    error: profileError instanceof Error ? profileError.message : error,
    refetchProfile,
    updateProfile: updateProfileMutation.mutate,
    changePassword: changePasswordMutation.mutate
  };
} 
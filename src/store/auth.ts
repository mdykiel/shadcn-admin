import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { AuthState, LoginCredentials, RegisterCredentials, BudgetUnit } from '@/types/auth';
import { authService } from '@/services/auth';
import { budgetUnitsService } from '@/services/budget-units';

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  setCurrentUnit: (unit: BudgetUnit | null) => void;
  addUnit: (unit: BudgetUnit) => void;
  loadUnits: () => Promise<void>;
  clearAuth: () => void;
  initializeAuth: () => Promise<void>;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  currentUnit: null,
  units: [],
  isLoading: false,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        login: async (credentials: LoginCredentials) => {
          try {
            set({ isLoading: true });
            const response = await authService.login(credentials);

            localStorage.setItem('auth-token', response.token);

            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              units: response.units,
              currentUnit: response.units[0] || null,
              isLoading: false,
            });
          } catch (error) {
            set({ isLoading: false });
            throw error;
          }
        },

        register: async (credentials: RegisterCredentials) => {
          try {
            set({ isLoading: true });
            const response = await authService.register(credentials);

            localStorage.setItem('auth-token', response.token);

            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              units: response.units,
              currentUnit: response.units[0] || null,
              isLoading: false,
            });
          } catch (error) {
            set({ isLoading: false });
            throw error;
          }
        },

        logout: async () => {
          try {
            await authService.logout();
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            localStorage.removeItem('auth-token');
            set(initialState);
          }
        },

        setCurrentUnit: (unit: BudgetUnit | null) => {
          set({ currentUnit: unit });
        },

        addUnit: (unit: BudgetUnit) => {
          set((state) => ({
            units: [...state.units, unit],
            currentUnit: unit,
          }));
        },

        loadUnits: async () => {
          try {
            const units = await budgetUnitsService.getAll();
            set((state) => ({
              units,
              currentUnit: state.currentUnit || units[0] || null,
            }));
          } catch (error) {
            console.error('Load units error:', error);
          }
        },

        clearAuth: () => {
          localStorage.removeItem('auth-token');
          set(initialState);
        },

        initializeAuth: async () => {
          const token = localStorage.getItem('auth-token');
          if (!token) {
            set({ ...initialState, isLoading: false });
            return;
          }

          try {
            set({ isLoading: true });
            const user = await authService.getMe();

            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });

            // Load units after successful auth
            const { loadUnits } = get();
            await loadUnits();
          } catch (error) {
            console.error('Auth initialization error:', error);
            localStorage.removeItem('auth-token');
            set({ ...initialState, isLoading: false });
          }
        },
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
          currentUnit: state.currentUnit,
          units: state.units,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
);
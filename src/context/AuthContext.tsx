// import { createContext, useContext } from 'react';
// // Pakai salah satu:
// // import type { User } from 'firebase/auth';
// type User = { id: string; email: string | null }; // sementara kalau belum punya

// export type AuthCtx = {
//   user: User | null;
//   loading: boolean;
//   login: (email: string, password: string) => Promise<void>;
//   signup: (name: string, email: string, password: string) => Promise<void>;
//   logout: () => Promise<void>;

//   // ⇩ sesuai pemakaian di page.tsx: social('google','signup')
//   social: (
//     provider: 'google' | 'github',
//     flow: 'signup' | 'signin'
//   ) => Promise<void>;
// };

// export const AuthContext = createContext<AuthCtx | undefined>(undefined);

// export function useAuth(): AuthCtx {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error('useAuth must be used within AuthProvider');
//   return ctx;
// }

// // (di file ini atau file lain) buat AuthProvider dan MASUKKAN 'social' ke value
// /*
// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   // ... state & impl login/signup/logout
//   const social: AuthCtx['social'] = async (provider, flow) => {
//     // implement google/github di sini
//   };

//   const value: AuthCtx = {
//     user, loading, login, signup, logout, social,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }
// */

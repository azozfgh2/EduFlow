import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Compass, Sparkles, ArrowRight } from 'lucide-react';

export function Login() {
  const [isSignUpFlow, setIsSignUpFlow] = useState(false);

  const handleLogin = async (action: 'signin' | 'signup') => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (action === 'signin' && !userDoc.exists()) {
        await signOut(auth);
        alert("حسابك غير مسجل في المنصة. يرجى إنشاء حساب جديد أولاً.");
      } else if (action === 'signup' && userDoc.exists()) {
        await signOut(auth);
        alert("هذا الحساب مسجل مسبقاً. يرجى تسجيل الدخول مباشرة.");
        setIsSignUpFlow(false);
      }
    } catch (error: any) {
      console.error("Error signing in with Google", error);
      if (error?.code === 'auth/cancelled-popup-request' || error?.code === 'auth/popup-closed-by-user') {
        // Silent or small alert
      } else {
        alert("حدث خطأ أثناء تسجيل الدخول أو التسجيل: " + (error?.message || ""));
      }
    }
  };

  return (
    <div className="min-h-screen bg-page-bg text-page-text flex flex-col justify-center items-center p-4 relative overflow-hidden" dir="rtl">
      {/* Atmosphere Background */}
      <div className="absolute inset-0 pointer-events-none z-[0] overflow-hidden opacity-50 dark:opacity-100">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="z-10 bg-surface-base/80 backdrop-blur-xl border border-border-subtle p-10 rounded-[2.5rem] shadow-glass max-w-md w-full flex flex-col items-center text-center animate-in zoom-in-95 duration-500 fade-in">
        <div className="w-20 h-20 bg-primary-base/10 text-primary-base rounded-full flex items-center justify-center mb-6 shadow-[var(--theme-shadow-primary-glow)]">
          <Sparkles className="w-10 h-10" />
        </div>

        {!isSignUpFlow ? (
          <>
            <h1 className="text-4xl font-light tracking-tight mb-3">
              مرحباً بك في <span className="font-bold text-transparent bg-clip-text bg-gradient-to-l from-page-text to-text-light">EduFlow</span>
            </h1>
            <p className="text-text-muted mb-10">منصة إدارة تعليمية متكاملة بانتظارك.</p>

            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={() => handleLogin('signin')}
                className="w-full flex items-center justify-center gap-3 bg-page-text text-page-bg hover:opacity-90 font-bold text-lg px-6 py-4 rounded-full transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                تسجيل الدخول باستخدام Google
              </button>
              
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-border-subtle"></div>
                <span className="flex-shrink-0 mx-4 text-text-muted text-sm">أو</span>
                <div className="flex-grow border-t border-border-subtle"></div>
              </div>

              <button 
                onClick={() => setIsSignUpFlow(true)}
                className="w-full flex items-center justify-center gap-3 bg-surface-hover text-page-text border border-border-subtle hover:bg-surface-active font-bold text-lg px-6 py-4 rounded-full transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
              >
                إنشاء حساب جديد
              </button>
            </div>
          </>
        ) : (
          <div className="w-full flex flex-col items-center animate-in slide-in-from-right-4 duration-300">
            <h1 className="text-3xl font-light tracking-tight mb-3">إنشاء حساب جديد</h1>
            <p className="text-text-muted mb-8">استخدم حساب جوجل الخاص بك للبدء بالتسجيل في المنصة</p>

            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={() => handleLogin('signup')}
                className="w-full flex items-center justify-center gap-3 bg-primary-base text-white hover:bg-primary-base/90 font-bold text-lg px-6 py-4 rounded-full transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                المتابعة باستخدام Google
              </button>

              <button 
                onClick={() => setIsSignUpFlow(false)}
                className="w-full flex items-center justify-center gap-2 text-text-muted hover:text-page-text font-bold text-sm px-6 py-4 rounded-full transition-all mt-2"
              >
                <ArrowRight className="w-4 h-4" />
                العودة لتسجيل الدخول
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

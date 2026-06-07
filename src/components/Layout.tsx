import React, { useState } from 'react';
import { Search, Calendar, Users, ClipboardList, MessageSquare, Bell, LogOut, Trash2, Settings, Video } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../lib/AuthContext';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile?: any;
}

export function Layout({ children, activeTab, setActiveTab, userProfile }: LayoutProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { user } = useAuth();
  
  const navItems = [
    { id: 'schedule', icon: Calendar, label: 'الجدول' },
    ...(userProfile?.role === 'teacher' ? [{ id: 'students', icon: Users, label: 'سجل الطلاب' }] : []),
    { id: 'tasks', icon: ClipboardList, label: 'المهام' },
    { id: 'discussions', icon: MessageSquare, label: 'النقاشات' },
    { id: 'meetings', icon: Video, label: 'المقابلات' },
    { id: 'settings', icon: Settings, label: 'الإعدادات' },
  ];

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <div className="min-h-screen bg-page-bg text-page-text selection:bg-primary-bg selection:text-primary-base font-sans relative overflow-x-hidden transition-colors duration-300" dir="rtl">
      {/* Atmosphere Background (Only visible in dark mode typically) */}
      <div className="fixed inset-0 pointer-events-none z-[0] overflow-hidden dark:visible invisible">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]"></div>
      </div>

      {/* Top Navbar */}
      <header className="fixed top-0 w-full z-50 bg-surface-base/80 backdrop-blur-xl border-b border-border-subtle transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img 
                src={user.photoURL}
                alt={user.displayName || 'المعلم'}
                className="w-10 h-10 rounded-full object-cover border border-border-subtle shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-bg text-primary-base flex items-center justify-center font-bold text-lg shrink-0 border border-primary-base/20">
                {user?.displayName?.charAt(0) || 'M'}
              </div>
            )}
            <div className="hidden sm:flex flex-col md:ml-4">
              <span className="font-bold text-xl text-page-text leading-tight">EduFlow</span>
              {userProfile && (
                <span className="text-xs text-text-muted font-medium">
                  {userProfile.role === 'teacher' ? `معلم ${userProfile.subject}` : `طالب (فصل: ${userProfile.classCode})`}
                </span>
              )}
            </div>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`p-2.5 rounded-2xl transition-colors flex items-center gap-2 ${
                    isActive 
                      ? 'text-primary-base bg-primary-bg border border-primary-base/20 shadow-[var(--theme-shadow-primary-glow)]' 
                      : 'text-text-light hover:bg-surface-hover hover:text-page-text'
                  }`}
                >
                  <Icon className="w-5 h-5" fill={isActive ? "currentColor" : "none"} />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>
          
          <div className="flex items-center gap-2 relative">
            <button 
              onClick={() => { setShowNotifications(!showNotifications); }}
              className="p-2.5 text-text-light hover:bg-surface-hover hover:text-page-text rounded-2xl transition-colors focus:outline-none relative"
            >
              <Bell className="w-5 h-5" />
            </button>

            {showNotifications && (
              <div className="absolute top-full left-0 mt-2 w-72 md:w-80 bg-surface-base border border-border-subtle rounded-3xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle mb-2">
                  <h3 className="font-bold text-page-text">الإشعارات</h3>
                  <span className="text-xs bg-surface-hover text-text-muted px-2 py-1 rounded-full font-medium">٠ جديد</span>
                </div>
                <div className="p-6 text-center text-text-muted">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p>لا توجد إشعارات حالياً</p>
                </div>
              </div>
            )}
            
            <ThemeToggle />
            <button className="p-2.5 text-text-light hover:bg-surface-hover hover:text-page-text rounded-2xl transition-colors focus:outline-none">
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={handleSignOut}
              className="p-2.5 text-text-light hover:bg-surface-hover hover:text-page-text rounded-2xl transition-colors focus:outline-none ml-2"
              title="تسجيل الخروج"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-24 md:pb-8 space-y-8 relative z-10 w-full">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-surface-base/90 backdrop-blur-xl border-t border-border-subtle pb-safe transition-colors duration-300">
        <div className="flex justify-around items-center h-[72px] w-full px-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center w-full py-2 relative active:scale-95 transition-all rounded-2xl mx-1 ${
                  isActive 
                    ? 'text-primary-base bg-primary-bg shadow-[var(--theme-shadow-primary-glow)] scale-105' 
                    : 'text-text-light hover:text-page-text'
                }`}
              >
                <Icon className="w-6 h-6 mb-1" fill={isActive ? "currentColor" : "none"} />
                <span className="text-[11px] font-bold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

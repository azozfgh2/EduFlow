/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { StudentsView } from './views/StudentsView';
import { ScheduleView, TasksView, DiscussionsView } from './views/OtherViews';
import { MeetingsView } from './views/MeetingsView';
import { SettingsView } from './components/SettingsView';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { Login } from './components/Login';
import { Onboarding } from './components/Onboarding';
import { db } from './lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

function AppContent() {
  const [activeTab, setActiveTab] = useState('students');
  const { user, loading } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.role === 'student' && activeTab === 'students') {
      setActiveTab('schedule');
    }
  }, [userProfile, activeTab]);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setProfileLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
      } else {
        setUserProfile(null);
      }
      setProfileLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-page-bg text-page-text flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-base border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!userProfile) {
    return <Onboarding onComplete={() => setProfileLoading(true)} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} userProfile={userProfile}>
      {activeTab === 'students' && <StudentsView />}
      {activeTab === 'schedule' && <ScheduleView userProfile={userProfile} />}
      {activeTab === 'tasks' && <TasksView userProfile={userProfile} />}
      {activeTab === 'discussions' && <DiscussionsView userProfile={userProfile} />}
      {activeTab === 'meetings' && <MeetingsView userProfile={userProfile} />}
      {activeTab === 'settings' && <SettingsView userProfile={userProfile} />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

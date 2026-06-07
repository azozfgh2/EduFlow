import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';
import { User, BookOpen, GraduationCap } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { user } = useAuth();
  const [role, setRole] = useState<'teacher' | 'student' | null>(null);
  const [name, setName] = useState(user?.displayName || '');
  const [subject, setSubject] = useState('');
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !role || !name.trim()) return;
    
    setLoading(true);
    try {
      if (role === 'student') {
        const q = query(collection(db, 'classes'), where('code', '==', classCode));
        const snapshots = await getDocs(q);
        if (snapshots.empty) {
          alert('كود الفصل غير صحيح أو غير موجود.');
          setLoading(false);
          return;
        }
        const classData = snapshots.docs[0].data();

        await setDoc(doc(db, 'users', user.uid), {
          role,
          name,
          classCode,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        const studentId = `STU-${Math.floor(Math.random() * 1000000)}`;

        await addDoc(collection(db, 'students'), {
          id: studentId,
          userId: classData.teacherId, // The teacher's UID
          name: name,
          className: classData.name,
          score: 100, // default
          performance: 'ممتاز',
          status: 'normal',
          attendance: 0,
          participation: 0,
          deductions: 0,
          behavioralNotes: '',
          contact: {
            phone: '',
            email: '',
            parentName: '',
            parentPhone: ''
          },
          courses: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

      } else {
        await setDoc(doc(db, 'users', user.uid), {
          role,
          name,
          subject,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      onComplete();
    } catch (error) {
      console.error("Error saving profile", error);
      alert("حدث خطأ أثناء حفظ البيانات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page-bg text-page-text flex flex-col justify-center items-center p-4 relative" dir="rtl">
      <div className="bg-surface-base border border-border-subtle p-8 rounded-3xl shadow-glass w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <h2 className="text-3xl font-light tracking-tight mb-6 text-center">أهلاً بك في <span className="font-bold text-primary-base">EduFlow</span></h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {!role ? (
            <div className="space-y-4">
              <p className="text-center text-text-muted mb-4">أخبرنا عن دورك في المنصة للبدء</p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button" 
                  onClick={() => setRole('teacher')}
                  className="flex flex-col items-center justify-center p-6 border-2 border-border-subtle rounded-2xl hover:border-primary-base hover:bg-primary-bg transition-all"
                >
                  <BookOpen className="w-10 h-10 mb-3 text-primary-base" />
                  <span className="font-bold">معلم</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setRole('student')}
                  className="flex flex-col items-center justify-center p-6 border-2 border-border-subtle rounded-2xl hover:border-success-base hover:bg-success-bg transition-all"
                >
                  <GraduationCap className="w-10 h-10 mb-3 text-success-base" />
                  <span className="font-bold">طالب</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-bottom-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">الاسم الكامل</label>
                <input 
                  required
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full bg-surface-hover border border-border-subtle rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-base"
                />
              </div>
              
              {role === 'teacher' && (
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">المادة التي تدرسها</label>
                  <input 
                    required
                    type="text" 
                    value={subject} 
                    onChange={e => setSubject(e.target.value)} 
                    placeholder="مثال: الرياضيات، الفيزياء..."
                    className="w-full bg-surface-hover border border-border-subtle rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-base"
                  />
                </div>
              )}

              {role === 'student' && (
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">كود الفصل</label>
                  <input 
                    required
                    type="text" 
                    value={classCode} 
                    onChange={e => setClassCode(e.target.value)} 
                    placeholder="أدخل الرمز المقدم من معلمك..."
                    className="w-full bg-surface-hover border border-border-subtle rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-base"
                  />
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setRole(null)}
                  className="px-5 py-3 border border-border-subtle rounded-xl hover:bg-surface-hover transition-colors font-medium text-page-text"
                >
                  رجوع
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 bg-primary-base text-white rounded-xl py-3 font-bold hover:bg-primary-base/90 transition-colors disabled:opacity-50"
                >
                  {loading ? 'يتم الحفظ...' : 'البدء'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { deleteUser, signOut } from 'firebase/auth';
import { Settings, Save, Trash2, Phone, Mail, User, BookOpen, Crown, CheckCircle2, CreditCard, Sparkles } from 'lucide-react';
import { Dialog } from './Dialog';

interface SettingsViewProps {
  userProfile: any;
}

export function SettingsView({ userProfile }: SettingsViewProps) {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phoneNumber || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile?.name || '');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const id = params.get('id');
    const status = params.get('status');
    const message = params.get('message');
    const plan = params.get('plan');

    if (payment === 'success' && status === 'paid' && user) {
      // In a real app, this should be validated securely via backend webhook
      // For this demo, we trust the redirect parameters
      updateDoc(doc(db, 'users', user.uid), { plan: 'pro' })
        .then(() => {
          alert('تم الترقية إلى باقة معلم النخبة Pro بنجاح!');
          // Clear URL parameters cleanly
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch(err => console.error("Error updating plan", err));
    } else if (payment === 'cancel' || status === 'failed') {
      alert(`عذراً، فشلت عملية الدفع. ${message || ''}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user]);

  // Grade Settings
  const initialGradeSettings = userProfile?.gradeSettings || { assignments: 10, participation: 10, tests: 20, projects: 20 };
  const [gradeSettings, setGradeSettings] = useState(initialGradeSettings);

  const calculateTotalGrades = () => {
    return Number(gradeSettings.assignments) + Number(gradeSettings.participation) + Number(gradeSettings.tests) + Number(gradeSettings.projects);
  };

  const handleUpgrade = async (type: 'monthly' | 'yearly') => {
    if (!user) return;
    setIsCheckoutLoading(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: type, userId: user.uid }),
      });
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (err: any) {
      console.error(err);
      alert('نظام الدفع غير متاح حالياً. نحن بصدد ربط الدفع الإلكتروني، يرجى المحاولة لاحقاً. (' + err.message + ')');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (userProfile.role === 'teacher' && calculateTotalGrades() !== 60) {
      alert('مجموع درجات أعمال السنة يجب أن يساوي 60 درجة.');
      return;
    }

    setIsSaving(true);
    try {
      const updateData: any = {
        name: displayName,
        phoneNumber: phoneNumber,
        updatedAt: serverTimestamp()
      };

      if (userProfile.role === 'teacher') {
        updateData.gradeSettings = {
          assignments: Number(gradeSettings.assignments),
          participation: Number(gradeSettings.participation),
          tests: Number(gradeSettings.tests),
          projects: Number(gradeSettings.projects),
        };
      }

      await updateDoc(doc(db, 'users', user.uid), updateData);
      alert('تم حفظ الإعدادات بنجاح');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(user);
      setShowDeleteConfirm(false);
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        alert("يرجى تسجيل الدخول مجدداً لتتمكن من حذف الحساب.");
        await signOut(auth);
      } else {
        alert("حدث خطأ أثناء حذف الحساب.");
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-2">
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-l from-page-text to-text-light">إعدادات الحساب</span>
        </h1>
        <p className="text-text-muted text-sm md:text-base">إدارة معلوماتك الشخصية وحسابك</p>
      </div>

      <div className="bg-surface-base border border-border-subtle p-6 rounded-3xl shadow-glass space-y-8">
        {/* Profile Info */}
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-border-subtle pb-2">
            <User className="w-5 h-5 text-primary-base" />
            المعلومات الأساسية
          </h3>
          <div className="space-y-3 px-2">
            <div className="flex flex-col mb-4">
              <label className="text-sm text-text-muted mb-1">الاسم الكامل (الاسم الظاهر)</label>
              <input 
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-surface-hover border border-border-subtle rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-base font-medium"
                placeholder="أدخل اسمك الظاهر..."
              />
            </div>
            <div className="flex flex-col mb-4">
              <span className="text-sm text-text-muted mb-1">البريد الإلكتروني</span>
              <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-text-muted" /> {user?.email}</span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-text-muted mb-1">التصنيف</span>
              {userProfile.role === 'teacher' ? (
                <span className="bg-primary-bg text-primary-base px-3 py-1 rounded-lg w-fit flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> معلم (مادة: {userProfile.subject})
                </span>
              ) : (
                <span className="bg-success-bg text-success-base px-3 py-1 rounded-lg w-fit">
                  طالب (كود الفصل: {userProfile.classCode})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Subscription Plans */}
        {userProfile?.role === 'teacher' && (
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-border-subtle pb-2">
              <Crown className="w-5 h-5 text-amber-500" />
              الاشتراكات والباقات
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              {/* Free Plan */}
              <div className={`p-6 rounded-3xl border transition-all ${userProfile.plan === 'free' || !userProfile.plan ? 'border-primary-base bg-primary-base/5 shadow-sm' : 'border-border-subtle bg-surface-base'}`}>
                <h4 className="font-bold text-2xl mb-1 text-page-text">الباقة الأساسية</h4>
                <p className="text-sm text-text-muted mb-6">مناسبة للبدء وإدارة المهام الأساسية</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-page-text">مجاناً</span>
                </div>
                <ul className="text-sm space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-text-muted"><CheckCircle2 className="w-5 h-5 text-primary-base shrink-0" /> إنشاء الجداول وإدارتها بحرية</li>
                  <li className="flex items-center gap-3 text-text-muted"><CheckCircle2 className="w-5 h-5 text-primary-base shrink-0" /> 15 مهمة وواجب في الشهر</li>
                  <li className="flex items-center gap-3 text-text-muted"><CheckCircle2 className="w-5 h-5 text-primary-base shrink-0" /> نقاشات ومحادثات مفتوحة بالفصول</li>
                  <li className="flex items-center gap-3 text-text-muted"><CheckCircle2 className="w-5 h-5 text-primary-base shrink-0" /> دعم المقابلات حتى 20 مستخدم</li>
                </ul>
                {(userProfile.plan === 'free' || !userProfile.plan) ? (
                  <button disabled className="w-full py-3 rounded-xl bg-surface-active text-text-muted font-bold cursor-not-allowed">الباقة الحالية</button>
                ) : (
                  <button disabled className="w-full py-3 rounded-xl bg-surface-hover text-text-muted font-bold cursor-not-allowed">الباقة المجانية الأساسية</button>
                )}
              </div>

              {/* Pro Plan */}
              <div className={`relative p-6 rounded-3xl border-2 transition-all ${userProfile.plan === 'pro' ? 'border-amber-500 bg-amber-500/5 shadow-[0_0_30px_rgba(245,158,11,0.15)] overflow-hidden' : 'border-amber-400 border-opacity-50 bg-gradient-to-br from-surface-base to-amber-500/5 hover:border-amber-500 shadow-md overflow-hidden'}`}>
                {userProfile.plan !== 'pro' && (
                  <div className="absolute -top-3 -right-12 bg-amber-500 text-white text-[10px] font-bold px-10 py-1 rotate-45">ينصح به</div>
                )}
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-2xl text-amber-500 flex items-center gap-2">
                    Pro <Sparkles className="w-5 h-5" />
                  </h4>
                </div>
                <p className="text-sm text-text-muted mb-6">لكل معلمي النخبة والمحترفين</p>
                <div className="mb-6 flex flex-col gap-1">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold text-page-text">26</span>
                    <span className="text-text-muted text-sm mb-1 line-through mx-1">39</span>
                    <span className="text-text-muted text-sm mb-1">ر.س / شهري</span>
                  </div>
                  <span className="text-xs font-semibold text-amber-500 bg-amber-500/10 w-fit px-2 py-0.5 rounded-full">أو وفر مع 260 ر.س بالسنة</span>
                </div>
                
                <ul className="text-sm space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-page-text font-medium"><CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" /> عدد لا محدود من المهام والواجبات</li>
                  <li className="flex items-center gap-3 text-page-text font-medium"><CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" /> مقابلات تدعم حتى 100 مستخدم</li>
                  <li className="flex items-center gap-3 text-page-text font-medium"><CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" /> تقارير وإحصائيات متقدمة للطلاب</li>
                  <li className="flex items-center gap-3 text-page-text font-medium"><CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" /> كافة ميزات الباقة الأساسية</li>
                </ul>
                {userProfile.plan === 'pro' ? (
                  <div className="w-full flex items-center justify-center py-3 rounded-xl bg-amber-500 text-white font-bold gap-2">
                    <Crown className="w-5 h-5" /> باقتك الحالية النشطة
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-center gap-3 mb-1 opactiy-80">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="h-4 object-contain" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-5 object-contain" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Mada_Logo.svg" alt="Mada" className="h-3 object-contain" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <button disabled={isCheckoutLoading} onClick={() => handleUpgrade('monthly')} className="w-full py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 shadow-sm transition-colors text-sm flex items-center justify-center gap-2">
                        {isCheckoutLoading ? <span className="animate-pulse">جاري التحويل...</span> : <><CreditCard className="w-4 h-4" /> اشتراك شهري</>}
                      </button>
                      <button disabled={isCheckoutLoading} onClick={() => handleUpgrade('yearly')} className="w-full py-3 rounded-xl bg-amber-500/10 text-amber-600 font-bold hover:bg-amber-500/20 shadow-sm transition-colors text-sm flex items-center justify-center gap-2">
                         {isCheckoutLoading ? <span className="animate-pulse">جاري التحويل...</span> : 'اشتراك سنوي'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Advanced Info Form */}
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-border-subtle pb-2">
            <Settings className="w-5 h-5 text-primary-base" />
            المعلومات المتقدمة
          </h3>
          <form onSubmit={handleSave} className="space-y-4 px-2">
            <div className="flex flex-col gap-1 mb-6">
              <label className="text-sm font-medium text-text-muted flex items-center gap-2">
                <Phone className="w-4 h-4" /> رقم الجوال
              </label>
              <input 
                type="tel"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="أدخل رقم الجوال..."
                className="w-full bg-surface-hover border border-border-subtle rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-base"
                dir="ltr"
              />
            </div>

            {userProfile.role === 'teacher' && (
              <div className="mb-6 bg-surface-base border border-border-subtle p-4 rounded-2xl">
                <h4 className="font-bold text-page-text mb-4 text-lg">توزيع الدرجات من (60 درجة)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-text-muted">الواجبات</label>
                    <input 
                      type="number" min="0" max="60"
                      value={gradeSettings.assignments}
                      onChange={e => setGradeSettings({...gradeSettings, assignments: parseInt(e.target.value) || 0})}
                      className="w-full bg-surface-hover border border-border-subtle rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-base"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-text-muted">التفاعل و المشاركة</label>
                    <input 
                      type="number" min="0" max="60"
                      value={gradeSettings.participation}
                      onChange={e => setGradeSettings({...gradeSettings, participation: parseInt(e.target.value) || 0})}
                      className="w-full bg-surface-hover border border-border-subtle rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-base"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-text-muted">الاختبارات</label>
                    <input 
                      type="number" min="0" max="60"
                      value={gradeSettings.tests}
                      onChange={e => setGradeSettings({...gradeSettings, tests: parseInt(e.target.value) || 0})}
                      className="w-full bg-surface-hover border border-border-subtle rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-base"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-text-muted">المشاريع</label>
                    <input 
                      type="number" min="0" max="60"
                      value={gradeSettings.projects}
                      onChange={e => setGradeSettings({...gradeSettings, projects: parseInt(e.target.value) || 0})}
                      className="w-full bg-surface-hover border border-border-subtle rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary-base"
                    />
                  </div>
                </div>
                
                <div className={`mt-4 text-sm font-medium flex justify-between items-center p-3 rounded-xl border ${calculateTotalGrades() !== 60 ? 'bg-danger-bg border-danger-base/30 text-danger-base' : 'bg-primary-bg border-primary-base/30 text-primary-base'}`}>
                  <span>مجموع الدرجات الموزعة:</span>
                  <span className="font-bold text-lg">{calculateTotalGrades()} / 60</span>
                </div>
                {calculateTotalGrades() !== 60 && <p className="text-danger-base text-xs mt-2 font-bold">لا يمكن حفظ التعديلات إذا كان المجموع لا يساوي 60 درجة.</p>}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={isSaving}
              className="flex items-center justify-center gap-2 bg-primary-base text-white px-6 py-3 rounded-xl hover:bg-primary-base/90 transition-colors font-bold w-full md:w-auto"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'يتم الحفظ...' : 'حفظ التعديلات'}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="pt-4 mt-8 border-t border-danger-base/20">
          <h3 className="text-xl font-bold text-danger-base mb-2">منطقة الخطر</h3>
          <p className="text-sm text-text-muted mb-4">عند حذف الحساب سيتم حذف كافة بياناتك ولا يمكن استعادتها.</p>
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center justify-center gap-2 w-full md:w-auto bg-danger-bg text-danger-base border border-danger-base/30 px-6 py-3 rounded-xl hover:bg-danger-base hover:text-white transition-colors font-bold"
          >
            <Trash2 className="w-5 h-5" />
            حذف الحساب نهائياً
          </button>
        </div>
      </div>

      <Dialog 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="حذف الحساب نهائياً"
        description="هل أنت متأكد من رغبتك في حذف الحساب؟ سيتم حذف جميع بياناتك وفصولك بشكل نهائي، ولا يمكن التراجع عن هذا الإجراء."
        primaryAction={handleDeleteAccount}
        primaryLabel="نعم، احذف حسابي"
        secondaryAction={() => setShowDeleteConfirm(false)}
        secondaryLabel="إلغاء التراجع"
        isDanger={true}
      />
    </div>
  );
}

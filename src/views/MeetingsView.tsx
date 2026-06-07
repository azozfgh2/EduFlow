import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, setDoc, query, collection, onSnapshot, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Video, Plus, Link, Calendar, Copy, CheckCircle2, User, Clock, Trash2 } from 'lucide-react';
import { JitsiMeeting } from '@jitsi/react-sdk';

export function MeetingsView({ userProfile }: { userProfile: any }) {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [meetingUrl, setMeetingUrl] = useState<string | null>(null);
  const [activeMeeting, setActiveMeeting] = useState<any>(null);
  
  const [showCreate, setShowCreate] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ title: '', scheduledFor: '' });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Check subscription bounds
  const plan = userProfile?.plan || 'free';
  const meetingLimit = plan === 'pro' ? 100 : 20;

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'meetings'));
    const unsub = onSnapshot(q, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() }));
      setMeetings(items.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));
    });
    return () => unsub();
  }, [user]);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userProfile.role !== 'teacher') return;
    if (!newMeeting.title.trim()) return;

    try {
      // Create a short room code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const roomName = `EduPlatform-${code}`;
      
      await addDoc(collection(db, 'meetings'), {
        title: newMeeting.title,
        roomName,
        inviteCode: code,
        teacherId: user?.uid,
        scheduledFor: newMeeting.scheduledFor || null,
        createdAt: serverTimestamp(),
      });
      setShowCreate(false);
      setNewMeeting({ title: '', scheduledFor: '' });
    } catch (error) {
      console.error(error);
      alert('خطأ في انشاء المقابلة');
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'meetings', id));
  };

  const joinMeetingByCode = () => {
    const code = prompt('أدخل رمز الدعوة للمقابلة:');
    if (!code) return;
    const meeting = meetings.find(m => m.inviteCode === code.trim().toUpperCase());
    if (meeting) {
      joinMeeting(meeting);
    } else {
      alert('رمز الدعوة غير صحيح!');
    }
  };

  const joinMeeting = (meeting: any) => {
    setActiveMeeting(meeting);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (activeMeeting) {
    return (
      <div className="flex flex-col h-[calc(100vh-6rem)] relative bg-surface-base rounded-2xl overflow-hidden shadow-sm border border-border-subtle animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-surface-hover border-b border-border-subtle p-4 flex justify-between items-center z-10 transition-transform">
           <div className="flex flex-col">
             <h3 className="font-bold text-page-text text-lg flex items-center gap-2">
               <Video className="w-5 h-5 text-primary-base" />
               {activeMeeting.title}
             </h3>
             <p className="text-xs text-text-muted mt-1 flex gap-2">
               <span>الحد الأقصى للمشاركين: {meetingLimit}</span>
               <span>•</span>
               <span>رمز الدعوة: <b className="text-primary-base">{activeMeeting.inviteCode}</b></span>
             </p>
           </div>
           <button onClick={() => setActiveMeeting(null)} className="px-5 py-2.5 bg-danger-base/10 text-danger-base rounded-xl text-sm font-bold hover:bg-danger-base hover:text-white transition-colors duration-200 shadow-sm">
             مغادرة الغرفة
           </button>
        </div>
        <div className="flex-1 w-full h-full bg-black">
           <JitsiMeeting
              roomName={activeMeeting.roomName}
              configOverwrite={{
                  startWithAudioMuted: true,
                  startWithVideoMuted: true,
                  disableModeratorIndicator: false,
                  enableEmailInStats: false,
              }}
              interfaceConfigOverwrite={{
                  DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
                  SHOW_CHROME_EXTENSION_BANNER: false,
              }}
              userInfo={{
                  displayName: userProfile?.name || 'مشارك',
              }}
              onApiReady={(externalApi) => {
                  // Custom event listeners can be attached here
                  console.log('Jitsi Meet API Ready');
              }}
              getIFrameRef={(iframeRef) => { 
                iframeRef.style.height = '100%'; 
                iframeRef.style.width = '100%'; 
              }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-page-text flex items-center gap-2">
             <Video className="w-6 h-6 text-primary-base" />
             غرف المقابلات المتقدمة
          </h2>
          <p className="text-text-muted mt-2 text-sm max-w-lg leading-relaxed">
            محاضرات تفاعلية مع ميزات رفع اليد، الدردشة المباشرة، ومشاركة الشاشة.
            <br/>الخطة الحالية: <b className="text-primary-base">{plan === 'pro' ? 'Pro' : 'مجانية'}</b> | الحد الأقصى للمشاركين: {meetingLimit} شخص
          </p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          {userProfile?.role === 'student' && (
            <button 
              onClick={joinMeetingByCode}
              className="flex-1 md:flex-none border border-primary-base text-primary-base bg-primary-base/5 px-6 py-2.5 rounded-full font-bold shadow-sm hover:bg-primary-base/10 transition-colors"
            >
              الانضمام برمز الدعوة
            </button>
          )}
          {userProfile?.role === 'teacher' && (
            <button 
              onClick={() => setShowCreate(!showCreate)}
              className="flex-1 md:flex-none bg-primary-base text-white px-6 py-2.5 rounded-full font-bold flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              جدولة مقابلة جديدة
            </button>
          )}
        </div>
      </div>

      {showCreate && userProfile?.role === 'teacher' && (
        <form onSubmit={handleCreateMeeting} className="mb-8 bg-surface-base border border-border-subtle p-6 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4 relative z-10 shadow-sm">
           <div className="col-span-full md:col-span-1">
             <label className="block text-sm font-bold text-page-text mb-2">عنوان المقابلة / المحاضرة</label>
             <input required placeholder="مثال: محاضرة مراجعة الرياضيات" className="w-full bg-surface-hover border border-border-subtle rounded-xl p-3 focus:ring-1 focus:ring-primary-base transition-colors" value={newMeeting.title} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} />
           </div>
           <div className="col-span-full md:col-span-1">
             <label className="block text-sm font-bold text-page-text mb-2">موعد المقابلة (اختياري)</label>
             <input type="datetime-local" className="w-full bg-surface-hover border border-border-subtle rounded-xl p-3 focus:ring-1 focus:ring-primary-base transition-colors text-page-text" value={newMeeting.scheduledFor} onChange={e => setNewMeeting({...newMeeting, scheduledFor: e.target.value})} />
           </div>
           <div className="col-span-full flex justify-end gap-3 mt-2">
             <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2.5 bg-surface-hover text-text-muted rounded-xl font-bold hover:bg-surface-active transition-colors">إلغاء</button>
             <button type="submit" className="px-6 py-2.5 bg-primary-base text-white rounded-xl font-bold shadow-sm hover:opacity-90 transition-all">إنشاء الغرفة</button>
           </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4">
        {meetings.length === 0 ? (
          <div className="col-span-full p-12 text-center text-text-muted border-2 border-dashed border-border-subtle rounded-3xl bg-surface-base/50">
            <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">لا يوجد مقابلات متاحة الان</h3>
            <p className="text-sm">يمكن للمعلمين جدولة وبدء محاضرات تفاعلية جديدة.</p>
          </div>
        ) : (
          meetings.map(m => (
            <div key={m.id} className="bg-surface-base border border-border-subtle p-6 rounded-3xl shadow-sm hover:border-primary-base/30 hover:shadow-md transition-all group flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary-base/10 shadow-[inset_0_0_10px_rgba(var(--color-primary-base),0.2)] flex items-center justify-center text-primary-base shrink-0">
                      <Video className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-page-text leading-tight mb-1">{m.title}</h4>
                      {m.scheduledFor && (
                         <div className="flex items-center gap-1.5 text-sm text-text-muted mt-1.5">
                           <Clock className="w-4 h-4" />
                           <span dir="ltr">{new Date(m.scheduledFor).toLocaleString('ar-SA')}</span>
                         </div>
                      )}
                    </div>
                  </div>
                  {userProfile?.role === 'teacher' && user?.uid === m.teacherId && (
                     <button onClick={() => handleDelete(m.id)} className="p-2 text-danger-base/50 hover:bg-danger-bg hover:text-danger-base rounded-xl transition-colors shrink-0">
                       <Trash2 className="w-5 h-5" />
                     </button>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mb-6 bg-surface-hover p-3 rounded-xl border border-border-subtle/50">
                  <div className="flex-1 text-sm font-medium text-page-text flex items-center gap-2">
                    <Link className="w-4 h-4 text-text-muted" /> رمز الدعوة:
                    <span className="bg-surface-active px-2 py-1 rounded text-primary-base font-mono tracking-widest">{m.inviteCode}</span>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(m.inviteCode)}
                    className="p-1.5 text-text-muted hover:text-primary-base bg-surface-active hover:bg-primary-base/10 rounded-lg transition-colors cursor-pointer"
                    title="نسخ الرمز"
                  >
                    {copiedId === m.inviteCode ? <CheckCircle2 className="w-5 h-5 text-success-base" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <button 
                onClick={() => joinMeeting(m)}
                className="w-full bg-primary-base/10 text-primary-base hover:bg-primary-base hover:text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm mt-auto"
              >
                انضمام للغرفة <User className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

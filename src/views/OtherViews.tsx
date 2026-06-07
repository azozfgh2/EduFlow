import React, { useState, useEffect, useRef } from 'react';
import { Clock, MapPin, User, CheckCircle2, Circle, AlertTriangle, Calendar as CalendarIcon, MessageSquare, Send, Plus, Upload, BookOpen, Presentation, Coffee, Trash2, X, Users, Edit3, Bell, Loader2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { collection, query, where, onSnapshot, addDoc, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { TaskCreationModal } from '../components/TaskCreationModal';
import { TaskSolveModal } from '../components/TaskSolveModal';
import { TaskReviewModal } from '../components/TaskReviewModal';

function StudentAttendanceModal({ isOpen, onClose, scheduleItem, activeClass }: { isOpen: boolean, onClose: () => void, scheduleItem: any, activeClass: any }) {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  
  useEffect(() => {
    if (!isOpen || !user || !activeClass) return;
    const q = query(collection(db, 'students'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach(doc => {
        const student = { docId: doc.id, ...doc.data() };
        if (student.className === activeClass.name) {
          items.push(student);
        }
      });
      setStudents(items);
    });
    return () => unsubscribe();
  }, [isOpen, user, activeClass]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-base w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-border-subtle shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start p-6 border-b border-border-subtle shrink-0">
          <div>
            <h3 className="text-2xl font-bold text-page-text flex items-center gap-2 mb-1">
              سجل الطلاب <span className="text-text-muted text-sm font-normal">({activeClass?.name})</span>
            </h3>
            <p className="text-text-muted text-sm">{scheduleItem?.subject} - {scheduleItem?.time}</p>
          </div>
          <button onClick={onClose} className="text-text-light hover:text-page-text hover:bg-surface-hover p-1.5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-surface-base/50">
          {students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-70">
              <User className="w-12 h-12 mb-3 text-text-light" />
              <p>لا يوجد طلاب حالياً في هذا الفصل</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {students.map(student => (
                <div key={student.docId} className="bg-surface-base border border-border-subtle p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary-bg text-primary-base flex items-center justify-center font-bold">
                       {student.name.charAt(0)}
                    </div>
                    <div className="font-bold text-page-text">{student.name}</div>
                  </div>
                  <div className="flex bg-surface-hover p-1 rounded-xl w-full border border-border-subtle">
                    <button 
                      onClick={() => setAttendance(prev => ({...prev, [student.docId]: 'present'}))}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${attendance[student.docId] === 'present' ? 'bg-success-base text-white shadow-sm' : 'text-text-muted hover:bg-surface-active'}`}
                    >
                      حضور
                    </button>
                    <button 
                      onClick={() => setAttendance(prev => ({...prev, [student.docId]: 'late'}))}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${attendance[student.docId] === 'late' ? 'bg-warning-base text-white shadow-sm' : 'text-text-muted hover:bg-surface-active'}`}
                    >
                      تأخير
                    </button>
                    <button 
                      onClick={() => setAttendance(prev => ({...prev, [student.docId]: 'absent'}))}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${attendance[student.docId] === 'absent' ? 'bg-danger-base text-white shadow-sm' : 'text-text-muted hover:bg-surface-active'}`}
                    >
                      غياب
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-border-subtle flex justify-end shrink-0">
          <button onClick={() => {
            alert('تم حفظ التحضير بنجاح');
            onClose();
          }} className="bg-primary-base text-white px-8 py-2.5 rounded-full font-bold shadow-sm hover:opacity-90">
            حفظ الانصراف
          </button>
        </div>
      </div>
    </div>
  );
}

export function ScheduleView({ userProfile }: { userProfile: any }) {
  const { user } = useAuth();
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ subject: '', day: '0', period: '1', grade: '', room: '' });
  
  const [scheduleTab, setScheduleTab] = useState<'personal' | 'class'>(
    userProfile?.role === 'student' ? 'class' : 'personal'
  );
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [selectedClassCode, setSelectedClassCode] = useState<string>('');
  
  const defaultTimes = {
    '1': '07:00', '2': '07:45', '3': '08:30', '4': '09:15', '5': '10:00', '6': '10:45', '7': '11:30'
  };
  
  const [periodTimes, setPeriodTimes] = useState<Record<string, string>>(defaultTimes);

  useEffect(() => {
    if (userProfile?.periodTimes) {
      setPeriodTimes({ ...defaultTimes, ...userProfile.periodTimes });
    }
  }, [userProfile]);

  const updatePeriodTime = async (period: string, time: string) => {
    const newTimes = { ...periodTimes, [period]: time };
    setPeriodTimes(newTimes);
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), { periodTimes: newTimes });
    }
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  };

  useEffect(() => {
    if (scheduleTab !== 'personal' || !('Notification' in window) || Notification.permission !== 'granted') return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const currentDay = now.getDay();
      if (currentDay > 4) return; // Sun=0 ... Thu=4
      
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${currentHours}:${currentMins}`;

      for (let p = 1; p <= 7; p++) {
        if (periodTimes[p.toString()] === timeStr) {
          const classNow = scheduleItems.find(item => item.day === currentDay && item.period === p);
          if (classNow && !classNow.notifiedToday) { // Basic dedup (in memory)
            new Notification('بدأت الحصة!', {
              body: `حصة ${classNow.subject} بتبدأ الآن.`
            });
            classNow.notifiedToday = true;
          }
        }
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [scheduleItems, periodTimes, scheduleTab]);


  useEffect(() => {
    if (!user || userProfile?.role !== 'teacher') return;
    const classQ = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
    const unsubscribe = onSnapshot(classQ, (snapshot) => {
      const clsData: any[] = [];
      snapshot.forEach(doc => clsData.push({ id: doc.id, ...doc.data() }));
      setTeacherClasses(clsData);
      if (clsData.length > 0 && !selectedClassCode) {
        setSelectedClassCode(clsData[0].code);
      }
    });
    return () => unsubscribe();
  }, [user, userProfile]);

  const activeClassCode = userProfile?.role === 'student' ? userProfile.classCode : selectedClassCode;

  useEffect(() => {
    if (!user) return;
    if (scheduleTab === 'class' && !activeClassCode) return;
    
    const firestoreQ = scheduleTab === 'personal' 
      ? query(collection(db, 'schedule'), where('userId', '==', user.uid))
      : query(collection(db, 'schedule'), where('classCode', '==', activeClassCode), where('type', '==', 'class'));

    const unsubscribe = onSnapshot(firestoreQ, (snapshot) => {
      let items: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (scheduleTab === 'personal' && data.type === 'class') return; // Skip class schedules if we are fetching personal
        items.push({ docId: doc.id, ...data });
      });
      setScheduleItems(items.sort((a,b) => (a.period || 0) - (b.period || 0)));
    });
    return () => unsubscribe();
  }, [user, scheduleTab, activeClassCode]);

  const canEdit = userProfile?.role === 'teacher';

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newItem.subject.trim()) return;
    if (scheduleTab === 'class' && !activeClassCode) return;

    try {
      await addDoc(collection(db, 'schedule'), {
        ...newItem,
        day: Number(newItem.day),
        period: Number(newItem.period),
        userId: user.uid,
        type: scheduleTab,
        classCode: scheduleTab === 'class' ? activeClassCode : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setShowAddForm(false);
      setNewItem({ subject: '', day: '0', period: '1', grade: '', room: '' });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      await deleteDoc(doc(db, 'schedule', docId));
    } catch (error) {
      console.error(error);
    }
  };

  const [scheduleItemToTrack, setScheduleItemToTrack] = useState<any>(null);

  const activeClass = teacherClasses.find(c => c.code === activeClassCode);
  const daysMapping = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-2"><span className="font-bold text-transparent bg-clip-text bg-gradient-to-l from-page-text to-text-light">الجدول الدراسي</span></h1>
          <p className="text-text-muted text-sm md:text-base">إدارة وتعديل جدول الحصص اليومي</p>
        </div>
        
        {canEdit && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            {scheduleTab === 'personal' && 'Notification' in window && Notification.permission !== 'granted' && (
               <button onClick={requestNotificationPermission} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-surface-active text-page-text rounded-full hover:bg-surface-hover transition-colors font-medium">
                 <Bell className="w-5 h-5" />
                 تفعيل الإشعارات
               </button>
            )}
            <button onClick={() => { setNewItem({ subject: '', day: '0', period: '1', grade: '', room: '' }); setShowAddForm(!showAddForm); }} className="flex-1 md:flex-none flex items-center gap-2 px-5 py-2.5 bg-primary-base text-white rounded-full hover:bg-primary-base/90 transition-colors shadow-sm font-medium justify-center">
              <Plus className="w-5 h-5" />
              <span className="inline">إضافة حصة</span>
            </button>
          </div>
        )}
      </div>
      
      {userProfile?.role !== 'student' && (
        <div className="flex flex-col sm:flex-row justify-between items-center bg-surface-base p-2 rounded-2xl border border-border-subtle gap-4">
          <div className="flex bg-surface-hover rounded-xl p-1 w-full sm:w-auto">
            <button 
              onClick={() => { setScheduleTab('personal'); setShowAddForm(false); }}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-medium transition-colors ${scheduleTab === 'personal' ? 'bg-surface-base text-primary-base shadow-sm' : 'text-text-muted hover:text-page-text'}`}
            >
              جدولي الشخصي
            </button>
            <button 
              onClick={() => { setScheduleTab('class'); setShowAddForm(false); }}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-medium transition-colors ${scheduleTab === 'class' ? 'bg-surface-base text-primary-base shadow-sm' : 'text-text-muted hover:text-page-text'}`}
            >
              جدول الفصل
            </button>
          </div>
          
          {scheduleTab === 'class' && userProfile?.role === 'teacher' && teacherClasses.length > 0 && (
            <select 
              value={selectedClassCode} 
              onChange={(e) => setSelectedClassCode(e.target.value)}
              className="w-full sm:w-auto bg-surface-hover border border-border-subtle rounded-xl px-4 py-2 text-page-text focus:outline-none focus:ring-2 focus:ring-primary-base"
            >
              {teacherClasses.map(cls => (
                <option key={cls.id} value={cls.code}>{cls.name} (كود: {cls.code})</option>
              ))}
            </select>
          )}
        </div>
      )}

      {showAddForm && canEdit && (
        <form onSubmit={handleAdd} className="bg-surface-base border border-border-subtle p-6 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4 relative z-10">
          <button type="button" onClick={() => setShowAddForm(false)} className="absolute top-4 left-4 p-1 text-text-muted hover:text-page-text">
            <X className="w-5 h-5" />
          </button>
          <div className="md:col-span-2"><h3 className="font-bold">حصة جديدة {scheduleTab === 'class' ? 'للفصل' : 'شخصية'}</h3></div>
          <input required placeholder="المادة" className="bg-surface-hover border border-border-subtle rounded-xl p-3 focus:ring-1 focus:ring-primary-base" value={newItem.subject} onChange={e => setNewItem({...newItem, subject: e.target.value})} />
          <select value={newItem.day} onChange={e => setNewItem({...newItem, day: e.target.value})} className="bg-surface-hover border border-border-subtle rounded-xl p-3 focus:ring-1 focus:ring-primary-base">
            {daysMapping.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
          <select value={newItem.period} onChange={e => setNewItem({...newItem, period: e.target.value})} className="bg-surface-hover border border-border-subtle rounded-xl p-3 focus:ring-1 focus:ring-primary-base">
            {[1,2,3,4,5,6,7].map(p => <option key={p} value={p}>الحصة {p}</option>)}
          </select>
          {scheduleTab === 'personal' && (
            <input placeholder="الفصل أو المستوى (اختياري)" className="bg-surface-hover border border-border-subtle rounded-xl p-3 focus:ring-1 focus:ring-primary-base" value={newItem.grade} onChange={e => setNewItem({...newItem, grade: e.target.value})} />
          )}
          <input placeholder="القاعة المخصصة (اختياري)" className="bg-surface-hover border border-border-subtle rounded-xl p-3 focus:ring-1 focus:ring-primary-base" value={newItem.room} onChange={e => setNewItem({...newItem, room: e.target.value})} />
          <div className="md:col-span-2 flex justify-end mt-2"><button type="submit" className="bg-primary-base text-white px-6 py-2 rounded-xl hover:opacity-90">حفظ</button></div>
        </form>
      )}

      <div className="overflow-x-auto pb-4">
        <table className="w-full text-center border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="p-3 border border-border-subtle bg-surface-hover text-text-muted font-medium w-24 rounded-tr-2xl">اليوم / الحصة</th>
              {[1,2,3,4,5,6,7].map(num => (
                <th key={num} className="p-3 border border-border-subtle bg-surface-hover min-w-[120px] font-medium text-text-muted pb-4">
                  <div className="font-bold text-page-text mb-2">الحصة {num}</div>
                  {scheduleTab === 'personal' ? (
                     <div className="flex flex-col items-center">
                       <input 
                         type="time" 
                         value={periodTimes[num.toString()] || ''}
                         onChange={(e) => updatePeriodTime(num.toString(), e.target.value)}
                         className="text-xs px-2 py-1.5 bg-surface-base border border-border-subtle rounded-md focus:ring-1 focus:ring-primary-base w-24 text-center cursor-pointer hover:border-primary-base/50 transition-colors"
                         dir="ltr"
                       />
                     </div>
                  ) : (
                     <div className="text-xs bg-surface-active px-2 py-1 rounded-md inline-block" dir="ltr">{periodTimes[num.toString()]}</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {daysMapping.map((dayName, dayIndex) => (
              <tr key={dayIndex}>
                <td className="p-3 border border-border-subtle bg-surface-hover font-bold text-page-text">{dayName}</td>
                {[1,2,3,4,5,6,7].map(periodNum => {
                   const items = scheduleItems.filter(i => i.day === dayIndex && i.period === periodNum);
                   const isClickable = scheduleTab === 'class' && userProfile?.role === 'teacher';
                   
                   return (
                      <td 
                        key={periodNum} 
                        className="p-2 border border-border-subtle relative h-[90px] align-top bg-surface-base/50 hover:bg-surface-base transition-colors" 
                        onClick={() => {
                          if (canEdit && items.length === 0) {
                            setNewItem({ ...newItem, day: dayIndex.toString(), period: periodNum.toString() });
                            setShowAddForm(true);
                          }
                        }}
                      >
                        {items.length > 0 ? items.map(item => (
                          <div 
                            key={item.docId} 
                            onClick={(e) => {
                              if (isClickable) {
                                e.stopPropagation();
                                setScheduleItemToTrack(item);
                              }
                            }}
                            className={`bg-primary-bg/50 border border-primary-base/20 text-page-text rounded-xl p-2.5 text-sm mb-1 group relative flex flex-col items-center justify-center min-h-[70px] ${isClickable ? 'cursor-pointer hover:bg-primary-bg transition-colors' : ''}`}
                          >
                            <div className="font-bold text-primary-base mb-1">{item.subject}</div>
                            {(item.room || item.grade) && (
                              <div className="text-[11px] text-text-muted flex gap-1 items-center justify-center flex-wrap">
                                {item.grade && <span>{item.grade}</span>}
                                {item.grade && item.room && <span>•</span>}
                                {item.room && <span>{item.room}</span>}
                              </div>
                            )}
                            {canEdit && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(item.docId); }} 
                                className="absolute hidden group-hover:flex -top-2 -right-2 bg-danger-base text-white rounded-full w-6 h-6 items-center justify-center shadow-sm hover:scale-110 transition-transform z-10"
                                title="حذف"
                              >
                                 <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )) : (
                          canEdit && (
                            <div className="w-full h-full min-h-[70px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-primary-base/40 hover:text-primary-base/80 bg-surface-active/0 hover:bg-surface-active/50 rounded-xl">
                               <Plus className="w-6 h-6" />
                            </div>
                          )
                        )}
                      </td>
                   )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <StudentAttendanceModal 
        isOpen={!!scheduleItemToTrack}
        onClose={() => setScheduleItemToTrack(null)}
        scheduleItem={scheduleItemToTrack}
        activeClass={activeClass}
      />
    </div>
  );
}

export function TasksView({ userProfile }: { userProfile: any }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [initialCreateType, setInitialCreateType] = useState('assignment');
  const [taskToSolve, setTaskToSolve] = useState<any>(null);
  const [taskToReview, setTaskToReview] = useState<any>(null);
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [selectedClassCode, setSelectedClassCode] = useState<string>('');

  useEffect(() => {
    if (!user || userProfile?.role !== 'teacher') return;
    const classQ = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
    const unsubscribe = onSnapshot(classQ, (snapshot) => {
      const clsData: any[] = [];
      snapshot.forEach(doc => clsData.push({ id: doc.id, ...doc.data() }));
      setTeacherClasses(clsData);
      if (clsData.length > 0 && !selectedClassCode) {
        setSelectedClassCode(clsData[0].code);
      }
    });
    return () => unsubscribe();
  }, [user, userProfile]);

  const activeClassCode = userProfile?.role === 'student' ? userProfile.classCode : selectedClassCode;

  useEffect(() => {
    if (!user || !activeClassCode) return;
    const q = query(collection(db, 'tasks'), where('classCode', '==', activeClassCode));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach(doc => items.push({ docId: doc.id, ...doc.data() }));
      setTasks(items.sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
    });
    return () => unsubscribe();
  }, [user, activeClassCode]);

  const handleTaskClick = (task: any) => {
    if (userProfile?.role === 'teacher') {
      setTaskToReview(task);
    } else {
      if (!isCompletedByMe(task)) {
        setTaskToSolve(task);
      }
    }
  };

  const isCompletedByMe = (task: any) => {
    return (task.completedBy || []).includes(user?.uid);
  };

  const completedCount = tasks.filter(t => isCompletedByMe(t)).length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'test': return 'اختبار';
      case 'project': return 'مشروع';
      case 'assignment':
      default: return 'واجب';
    }
  };

  const getTaskTypeStyle = (type: string) => {
    switch (type) {
      case 'test': return 'bg-success-bg text-success-base';
      case 'project': return 'bg-[#673AB7]/10 text-[#673AB7]';
      case 'assignment':
      default: return 'bg-primary-bg text-primary-base';
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-2"><span className="font-bold text-transparent bg-clip-text bg-gradient-to-l from-page-text to-text-light">استديو المهام والاختبارات</span></h1>
          <p className="text-text-muted text-sm md:text-base">متابعة الواجبات، المهام الأدائية، والاختبارات</p>
        </div>
        {userProfile?.role === 'teacher' && teacherClasses.length > 0 && (
          <select 
            value={selectedClassCode} 
            onChange={(e) => setSelectedClassCode(e.target.value)}
            className="bg-surface-base border border-border-subtle rounded-xl px-4 py-2 text-page-text focus:outline-none focus:ring-2 focus:ring-primary-base w-full md:w-auto"
          >
            {teacherClasses.map(cls => (
              <option key={cls.id} value={cls.code}>{cls.name} (كود: {cls.code})</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {userProfile?.role === 'teacher' && (
            <div className="bg-surface-base p-6 border border-border-subtle rounded-3xl shadow-sm space-y-4">
              <div className="mb-2">
                <h3 className="font-bold text-page-text text-lg">نشر المهام</h3>
                <p className="text-sm text-text-muted">اختر نوع العمل الذي تريد نشره وإرساله للطلاب.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => { 
                    if (!activeClassCode) {
                      alert('يجب عليك إنشاء فصل دراسي أولاً من قسم "فصولي" (أو الطلاب) لتتمكن من نشر المهام.');
                      return;
                    }
                    setInitialCreateType('assignment'); 
                    setIsCreateModalOpen(true); 
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-colors shadow-sm ${!activeClassCode ? 'bg-surface-hover text-text-muted cursor-not-allowed border border-border-subtle' : 'bg-primary-base text-white hover:opacity-90'}`}
                >
                  <Plus className="w-5 h-5" />
                  نشر واجب
                </button>
                <button 
                  onClick={() => { 
                    if (!activeClassCode) {
                      alert('يجب عليك إنشاء فصل دراسي أولاً من قسم "فصولي" (أو الطلاب) لتتمكن من نشر المهام.');
                      return;
                    }
                    setInitialCreateType('project'); 
                    setIsCreateModalOpen(true); 
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-colors shadow-sm ${!activeClassCode ? 'bg-surface-hover text-text-muted cursor-not-allowed border border-border-subtle' : 'bg-[#673AB7] text-white hover:opacity-90'}`}
                >
                  <Plus className="w-5 h-5" />
                  نشر مشروع
                </button>
                <button 
                  onClick={() => { 
                    if (!activeClassCode) {
                      alert('يجب عليك إنشاء فصل دراسي أولاً من قسم "فصولي" (أو الطلاب) لتتمكن من نشر المهام.');
                      return;
                    }
                    setInitialCreateType('test'); 
                    setIsCreateModalOpen(true); 
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-colors shadow-sm ${!activeClassCode ? 'bg-surface-hover text-text-muted cursor-not-allowed border border-border-subtle' : 'bg-success-base text-white hover:opacity-90'}`}
                >
                  <Plus className="w-5 h-5" />
                  نشر اختبار
                </button>
              </div>
              {!activeClassCode && (
                <div className="p-4 mt-2 bg-danger-bg text-danger-base rounded-xl border border-danger-base/20 text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  لا يمكنك نشر مهام لأنه ليس لديك أي فصل دراسي حتى الآن. قم بالانتقال لتبويب (فصولي) لإنشاء فصلك الأول.
                </div>
              )}
            </div>
          )}

          {tasks.length === 0 ? (
             <div className="p-10 text-center text-text-muted bg-surface-base/50 rounded-3xl border border-border-subtle border-dashed">
               لا يوجد مهام مسجلة. {userProfile?.role === 'teacher' ? 'قم بالإنشاء بالأعلى!' : ''}
              </div>
          ) : (
            <div className="space-y-4">
              {tasks.map(task => {
                const completed = isCompletedByMe(task);
                return (
                <div 
                  key={task.docId} 
                  onClick={() => handleTaskClick(task)}
                  className={`flex flex-col p-4 rounded-2xl border ${userProfile?.role === 'student' && !completed ? 'cursor-pointer hover:border-primary-base/30' : userProfile?.role === 'teacher' ? 'cursor-pointer hover:border-primary-base/30' : ''} transition-all ${completed ? 'bg-surface-active/50 border-border-subtle opacity-80' : 'bg-surface-base border-border-subtle shadow-sm'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {userProfile?.role === 'student' && (
                        <button className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${completed ? 'bg-success-base text-white' : 'border-2 border-text-light text-transparent'}`}>
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      <div className="flex flex-col">
                        <span className={`font-bold text-lg mb-1 ${completed ? 'text-text-muted line-through' : 'text-page-text'}`}>{task.title}</span>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className={`text-xs w-fit px-2 py-0.5 rounded-md ${getTaskTypeStyle(task.type)}`}>{getTaskTypeLabel(task.type)}</span>
                          <span className="text-xs text-text-muted bg-surface-hover px-2 py-0.5 rounded-md">الدرجة: {task.maxGrade || 10}</span>
                          {task.deadline && <span className="text-xs text-text-muted bg-surface-hover px-2 py-0.5 rounded-md flex items-center gap-1"><Clock className="w-3 h-3"/> تسليم: {new Date(task.deadline).toLocaleDateString('ar')}</span>}
                          {userProfile?.role === 'teacher' && (
                            <span className="text-xs text-text-muted flex items-center gap-1 bg-surface-hover px-2 py-0.5 rounded-md"><Users className="w-3 h-3" /> {(task.completedBy || []).length} أنجزوا</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {userProfile?.role === 'teacher' && (
                      <button onClick={(e) => { e.stopPropagation(); deleteDoc(doc(db, 'tasks', task.docId)); }} className="p-2 text-danger-base hover:bg-danger-bg rounded-lg shrink-0 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>

        {userProfile?.role === 'student' && (
          <div className="bg-surface-base/80 backdrop-blur-xl border border-border-subtle rounded-3xl p-6 shadow-glass h-fit sticky top-6">
            <h3 className="font-bold text-lg text-page-text mb-6">مُلخص الإنجاز</h3>
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-surface-hover" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" stroke="currentColor" strokeWidth="3" fill="none" />
                  <path className="text-primary-base transition-all duration-1000 ease-out" strokeDasharray={`${progress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" stroke="currentColor" strokeWidth="3" fill="none" />
                </svg>
                <div className="absolute text-3xl font-light text-page-text">{progress}%</div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted">المهام المكتملة</span>
                <span className="font-bold text-success-base">{completedCount}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted">المهام المتبقية</span>
                <span className="font-bold text-primary-base">{tasks.length - completedCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <TaskCreationModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        teacherClasses={teacherClasses}
        userId={user.uid}
        initialTaskType={initialCreateType}
        userProfile={userProfile}
      />
      
      <TaskSolveModal
        isOpen={!!taskToSolve}
        onClose={() => setTaskToSolve(null)}
        task={taskToSolve}
        userId={user.uid}
      />
      
      <TaskReviewModal
        isOpen={!!taskToReview}
        onClose={() => setTaskToReview(null)}
        task={taskToReview}
      />
    </div>
  );
}

export function DiscussionsView({ userProfile }: { userProfile: any }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [selectedClassCode, setSelectedClassCode] = useState<string>('');

  useEffect(() => {
    if (!user || userProfile?.role !== 'teacher') return;
    const classQ = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
    const unsubscribe = onSnapshot(classQ, (snapshot) => {
      const clsData: any[] = [];
      snapshot.forEach(doc => clsData.push({ id: doc.id, ...doc.data() }));
      setTeacherClasses(clsData);
      if (clsData.length > 0 && !selectedClassCode) {
        setSelectedClassCode(clsData[0].code);
      }
    });
    return () => unsubscribe();
  }, [user, userProfile]);

  const activeClassCode = userProfile?.role === 'student' ? userProfile.classCode : selectedClassCode;

  useEffect(() => {
    if (!user || !activeClassCode) return;
    const q = query(collection(db, 'messages'), where('classCode', '==', activeClassCode));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach(doc => items.push({ docId: doc.id, ...doc.data() }));
      setMessages(items.sort((a,b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0)));
    });
    return () => unsubscribe();
  }, [user, activeClassCode]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!user || !newMsg.trim() || !activeClassCode) return;
    try {
      await addDoc(collection(db, 'messages'), {
        content: newMsg,
        author: userProfile?.name || user.displayName || 'أنا',
        userId: user.uid,
        classCode: activeClassCode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setNewMsg('');
    } catch(err) { console.error(err); }
  };

  return (
    <div className="flex flex-col gap-6 w-full h-[calc(100vh-140px)] animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-2"><span className="font-bold text-transparent bg-clip-text bg-gradient-to-l from-page-text to-text-light">ساحة النقاش</span></h1>
          <p className="text-text-muted text-sm md:text-base">مساحة للتواصل بين المعلم والطلاب.</p>
        </div>
        
        {userProfile?.role === 'teacher' && teacherClasses.length > 0 && (
          <select 
            value={selectedClassCode} 
            onChange={(e) => setSelectedClassCode(e.target.value)}
            className="bg-surface-base border border-border-subtle rounded-xl px-4 py-2 text-page-text focus:outline-none focus:ring-2 focus:ring-primary-base w-full md:w-auto"
          >
            {teacherClasses.map(cls => (
              <option key={cls.id} value={cls.code}>{cls.name} (كود: {cls.code})</option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-surface-base/80 backdrop-blur-xl border border-border-subtle rounded-3xl flex flex-col shadow-glass flex-1 min-h-[400px] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="text-center text-text-muted h-full flex flex-col items-center justify-center">
              <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
              لا توجد رسائل حالياً في هذا الفصل.
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.userId === user?.uid;
              return (
                <div key={msg.docId} className={`flex gap-4 max-w-[85%] ${isMe ? 'mr-auto flex-row-reverse' : 'ml-auto'}`}>
                  <div className={`w-10 h-10 rounded-full border border-border-subtle flex items-center justify-center shrink-0 ${isMe ? 'bg-primary-bg text-primary-base' : 'bg-surface-hover text-text-muted'} font-bold`}>
                    {msg.author.charAt(0)}
                  </div>
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-text-muted mb-1 px-1">{msg.author}</span>
                    <div className={`p-4 rounded-2xl ${isMe ? 'bg-primary-base text-white rounded-tr-none shadow-sm' : 'bg-surface-hover text-page-text rounded-tl-none border border-border-subtle'}`}>
                      <p className="leading-relaxed text-sm md:text-base">{msg.content}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 bg-surface-base border-t border-border-subtle">
          <form onSubmit={sendMessage} className="flex items-center gap-3">
            <input 
              type="text" 
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              placeholder="اكتب رسالة..."
              disabled={!activeClassCode}
              className="flex-1 bg-surface-hover border border-border-subtle rounded-full py-3 px-5 text-page-text placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-base disabled:opacity-50"
            />
            <button type="submit" disabled={!newMsg.trim() || !activeClassCode} className="w-12 h-12 bg-primary-base text-white rounded-full flex items-center justify-center shrink-0 hover:bg-primary-base/90 transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:hover:bg-primary-base">
              <Send className="w-5 h-5 rtl:-scale-x-100" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


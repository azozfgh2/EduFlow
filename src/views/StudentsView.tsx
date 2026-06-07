import React, { useState, useEffect } from 'react';
import { Search, Filter, Users, BarChart2, AlertTriangle, MoreVertical, ChevronRight, ChevronLeft, Download, Trash2, X, Phone, Mail, User, BookOpen, ChevronDown, ChevronUp, Settings2, CheckCircle2, FileText, Plus, Copy, ArrowRight } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { collection, query, where, onSnapshot, addDoc, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Dialog } from '../components/Dialog';

interface Student {
  id: string;
  docId: string;
  name: string;
  className: string;
  score: number;
  performance: string;
  status: 'normal' | 'alert' | 'excellent';
  attendance: number;
  participation: number;
  deductions: number;
  behavioralNotes: string;
  avatar?: string;
  contact: {
    phone: string;
    email: string;
    parentName: string;
    parentPhone: string;
  };
  courses: Array<{ name: string; score: number }>;
}

export function StudentsView() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({ score: 0, parentPhone: '' });
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [visibleColumns, setVisibleColumns] = useState({
    className: true,
    score: true,
    performance: true
  });

  useEffect(() => {
    if (!user) return;

    const classQ = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
    const unsubscribeClasses = onSnapshot(classQ, (snapshot) => {
      const clsData: any[] = [];
      snapshot.forEach(doc => clsData.push({ id: doc.id, ...doc.data() }));
      setTeacherClasses(clsData.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
    });
    
    const q = query(collection(db, 'students'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentsData: Student[] = [];
      snapshot.forEach((doc) => {
        studentsData.push({ docId: doc.id, ...doc.data() } as Student);
      });
      setStudents(studentsData);
    }, (error) => {
      console.error("Error fetching students: ", error);
    });

    return () => {
      unsubscribe();
      unsubscribeClasses();
    };
  }, [user]);

  const studentSpan = 11 - (visibleColumns.className ? 2 : 0) - (visibleColumns.score ? 2 : 0) - (visibleColumns.performance ? 2 : 0);

  const handleDelete = (docId: string) => {
    deleteDoc(doc(db, 'students', docId)).catch(err => console.error(err));
    setStudentToDelete(null);
  };

  const handleEditClick = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    setStudentToEdit(student);
    setEditForm({ score: student.score, parentPhone: student.contact?.parentPhone || '' });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentToEdit) return;
    try {
      const updateData: any = {
        score: editForm.score,
        'contact.parentPhone': editForm.parentPhone,
        updatedAt: serverTimestamp()
      };
      
      if (editForm.score < 60) updateData.status = 'alert';
      else if (editForm.score >= 90) updateData.status = 'excellent';
      else updateData.status = 'normal';

      await updateDoc(doc(db, 'students', studentToEdit.docId), updateData);
      setStudentToEdit(null);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedStudentId(prev => prev === id ? null : id);
  };

  const activeClass = teacherClasses.find(c => c.id === selectedClassId);

  const classFilteredStudents = students.filter(student => 
    selectedClassId ? student.className === activeClass?.name : false
  );

  const filteredStudents = classFilteredStudents.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    student.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statsAverageScore = classFilteredStudents.length > 0 ? Math.round(classFilteredStudents.reduce((acc, s) => acc + s.score, 0) / classFilteredStudents.length) : 0;
  const statsNeedsFollowUp = classFilteredStudents.filter(s => s.status === 'alert').length;

  const handleExportCSV = () => {
    const headers = ['رقم الطالب', 'الاسم', 'الفصل', 'نسبة النجاح', 'الأداء العام'];
    const csvContent = [
      headers.join(','),
      ...filteredStudents.map(s => `${s.id},${s.name},${s.className},${s.score}%,${s.performance}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `students_export_${new Date().toLocaleDateString('ar-SA')}.csv`;
    link.click();
    setShowExportConfirm(false);
  };

  const scoreData = classFilteredStudents.map((s) => ({ name: s.name.split(' ')[0], score: s.score })).slice(0, 10);
  const attendanceData = classFilteredStudents.map((s) => ({ name: s.name.split(' ')[0], rate: 85 + Math.random() * 15 })).slice(0, 10);
  const performanceEvolutionData = [
    { semester: 'الفصل الأول', score: 78 },
    { semester: 'الفصل الثاني', score: 82 },
    { semester: 'الفصل الحالي', score: 86 }
  ];

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'alert': return 'bg-danger-bg text-danger-base border-danger-base/30';
      case 'excellent': return 'bg-success-bg text-success-base border-success-base/30';
      default: return 'bg-surface-hover text-page-text border-border-subtle';
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'bg-success-base';
    if (score >= 75) return 'bg-warning-base';
    return 'bg-danger-base';
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newClassName.trim()) return;
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      await addDoc(collection(db, 'classes'), {
        name: newClassName,
        code,
        teacherId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setShowAddClassModal(false);
      setNewClassName('');
    } catch (error) {
      console.error("Error adding class: ", error);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('تم نسخ كود الدعوة بنجاح');
  };

  if (!selectedClassId) {
    return (
      <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-2"><span className="font-bold text-transparent bg-clip-text bg-gradient-to-l from-page-text to-text-light">فصولي الدراسية</span></h1>
            <p className="text-text-muted text-sm md:text-base">إدارة الفصول والطلاب وتوليد رموز الانضمام</p>
          </div>
          <button 
            onClick={() => setShowAddClassModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-base text-white rounded-full hover:bg-primary-base/90 transition-colors font-medium focus:outline-none shadow-[var(--theme-shadow-primary-glow)] relative overflow-hidden"
          >
            <Plus className="w-5 h-5 relative z-10" />
            <span className="relative z-10 whitespace-nowrap">إنشاء فصل جديد</span>
          </button>
        </div>

        {teacherClasses.length === 0 ? (
          <div className="bg-surface-base/80 p-12 rounded-[2.5rem] border border-border-subtle backdrop-blur-lg flex flex-col items-center justify-center text-center shadow-glass mb-8">
            <div className="w-20 h-20 rounded-full bg-surface-hover flex items-center justify-center text-text-light mb-4">
              <BookOpen className="w-10 h-10 opacity-30" />
            </div>
            <h3 className="text-xl font-bold text-page-text mb-2">لا توجد فصول دراسية</h3>
            <p className="text-text-muted">قم بإنشاء فصل جديد لتتمكن من دعوة طلابك إليه.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teacherClasses.map(cls => {
              const studentCount = students.filter(s => s.className === cls.name).length;
              return (
                <div key={cls.id} className="bg-surface-base border border-border-subtle rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-primary-base/30 transition-all group flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary-bg text-primary-base flex items-center justify-center">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="bg-surface-hover px-3 py-1 rounded-full border border-border-subtle flex items-center gap-2">
                         <span className="text-sm font-medium text-page-text font-mono tracking-widest">{cls.code}</span>
                         <button onClick={() => copyCode(cls.code)} className="text-text-muted hover:text-primary-base transition-colors p-1 rounded-md" title="نسخ الكود"><Copy className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-page-text mb-1">{cls.name}</h3>
                    <p className="text-text-muted text-sm flex items-center gap-1"><Users className="w-4 h-4" /> {studentCount} طالب مسجل</p>
                  </div>
                  <button 
                    onClick={() => setSelectedClassId(cls.id)}
                    className="w-full mt-6 py-3 bg-surface-hover border border-border-subtle text-page-text rounded-xl font-medium focus:outline-none flex items-center justify-center gap-2 group-hover:bg-primary-base group-hover:text-white transition-colors"
                  >
                    عرض التفاصيل <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {showAddClassModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-surface-base w-full max-w-md rounded-3xl p-6 border border-border-subtle shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-page-text flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary-base" /> إضافة فصل جديد
                </h3>
                <button onClick={() => setShowAddClassModal(false)} className="text-text-light hover:text-page-text hover:bg-surface-hover p-1.5 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddClass} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">اسم الفصل / المجموعة</label>
                  <input required type="text" placeholder="مثال: الصف العاشر أ" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} className="w-full bg-surface-hover border border-border-subtle rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-base text-page-text leading-tight" />
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-border-subtle">
                  <button type="button" onClick={() => setShowAddClassModal(false)} className="px-5 py-2.5 rounded-full font-medium text-page-text hover:bg-surface-hover transition-colors">إلغاء</button>
                  <button type="submit" className="px-5 py-2.5 rounded-full bg-primary-base text-white hover:bg-primary-base/90 transition-colors font-medium shadow-[var(--theme-shadow-primary-glow)]">إنشاء الفصل</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedClassId(null)} className="p-3 border border-border-subtle rounded-full bg-surface-base hover:bg-surface-hover text-page-text transition-colors">
            <ArrowRight className="w-5 h-5 rtl:rotate-180" />
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-2">
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-l from-page-text to-text-light">{activeClass?.name}</span>
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-text-muted text-sm md:text-base">استعرض طلاب فصلك وتابع نشاطهم</p>
              <div className="px-2 py-1 bg-surface-hover border border-border-subtle rounded-md text-xs font-mono text-text-muted tracking-widest hidden sm:flex items-center gap-1.5 focus:outline-none group">
                {activeClass?.code} 
                <button type="button" onClick={() => activeClass && copyCode(activeClass.code)} className="text-primary-base opacity-70 group-hover:opacity-100 transition-opacity">
                   <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-60 w-full">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-text-light" />
            </div>
            <input
              type="text"
              placeholder="البحث بالاسم أو الرقم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-4 pr-10 py-3 border border-border-subtle rounded-full leading-5 bg-surface-base/50 text-page-text placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-base focus:border-primary-base sm:text-sm transition-all backdrop-blur-md shadow-sm"
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => setShowExportConfirm(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-surface-base/50 border border-border-subtle text-page-text rounded-full hover:bg-surface-hover transition-colors font-medium focus:outline-none shadow-sm relative overflow-hidden"
            >
              <Download className="w-5 h-5 relative z-10" />
              <span className="relative z-10 whitespace-nowrap hidden md:inline">تصدير CSV</span>
            </button>
          </div>
        </div>
      </div>

      <Dialog 
        isOpen={showExportConfirm} 
        onClose={() => setShowExportConfirm(false)}
        title="تأكيد تصدير البيانات"
        description="هل أنت متأكد من رغبتك في تصدير بيانات الطلاب الحالية إلى ملف CSV؟"
        primaryAction={handleExportCSV}
        primaryLabel="تأكيد التصدير"
        secondaryAction={() => setShowExportConfirm(false)}
        secondaryLabel="إلغاء"
      />
      <Dialog 
        isOpen={!!studentToDelete} 
        onClose={() => setStudentToDelete(null)}
        title="حذف سجل الطالب"
        description="تحذير: سيتم حذف سجل الطالب وجميع التقييمات المرتبطة به نهائياً. هل أنت متأكد؟"
        primaryAction={() => studentToDelete && handleDelete(studentToDelete)}
        primaryLabel="حذف نهائي"
        secondaryAction={() => setStudentToDelete(null)}
        secondaryLabel="تراجع"
        isDanger={true}
      />

      {studentToEdit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-base w-full max-w-md rounded-3xl p-6 border border-border-subtle shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-page-text flex items-center gap-2">
                تعديل بيانات الطالب
              </h3>
              <button type="button" onClick={() => setStudentToEdit(null)} className="text-text-light hover:text-page-text hover:bg-surface-hover p-1.5 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">النسبة المئوية والدرجات (%)</label>
                <input required type="number" min="0" max="100" value={editForm.score} onChange={(e) => setEditForm({...editForm, score: Number(e.target.value)})} className="w-full bg-surface-hover border border-border-subtle rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-base" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">رقم ولي الأمر</label>
                <input type="text" dir="ltr" placeholder="+96650000000" value={editForm.parentPhone} onChange={(e) => setEditForm({...editForm, parentPhone: e.target.value})} className="w-full bg-surface-hover border border-border-subtle rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-primary-base" />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-border-subtle">
                <button type="button" onClick={() => setStudentToEdit(null)} className="px-5 py-2.5 rounded-full font-medium text-page-text hover:bg-surface-hover transition-colors">إلغاء</button>
                <button type="submit" className="px-5 py-2.5 rounded-full bg-primary-base text-white hover:bg-primary-base/90 transition-colors font-medium">حفظ التغييرات</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {classFilteredStudents.length === 0 ? (
        <div className="bg-surface-base/80 p-12 rounded-[2.5rem] border border-border-subtle backdrop-blur-lg flex flex-col items-center justify-center text-center shadow-glass mb-8">
          <div className="w-20 h-20 rounded-full bg-surface-hover flex items-center justify-center text-text-light mb-4">
            <Users className="w-10 h-10 opacity-30" />
          </div>
          <h3 className="text-xl font-bold text-page-text mb-2">لا يوجد طلاب في هذا الفصل</h3>
          <p className="text-text-muted mb-6 max-w-md">لم يقم أي طالب بالانضمام باستخدام كود الدعوة الخاص بك حتى الآن.</p>
          <div className="p-4 bg-surface-hover border border-border-subtle rounded-2xl flex items-center gap-4">
            <span className="text-2xl font-mono tracking-widest font-bold text-page-text">{activeClass?.code}</span>
            <button onClick={() => activeClass && copyCode(activeClass.code)} className="p-2.5 border border-border-subtle rounded-xl bg-surface-base hover:bg-primary-bg hover:border-primary-base/30 text-primary-base shadow-sm transition-all focus:ring-2 focus:ring-primary-base">
              <Copy className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-text-muted mt-3">انسخ الكود وشاركه مع الطلاب</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
            <div className="bg-surface-base/80 p-6 rounded-[2.5rem] border border-border-subtle backdrop-blur-lg flex flex-col relative overflow-hidden group shadow-glass">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-text-muted font-semibold text-sm uppercase tracking-widest relative z-10">متوسط درجات الفصل</h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-light tracking-tighter text-page-text">{statsAverageScore}%</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary-bg flex items-center justify-center text-primary-base">
                  <BarChart2 className="w-5 h-5" />
                </div>
              </div>
              <div className="h-48 w-full relative z-10 min-h-[192px]" dir="ltr">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={scoreData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3525cd" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3525cd" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--theme-border)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--theme-text-light)', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--theme-text-light)', fontSize: 12 }} dx={-10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)', borderRadius: '1rem', color: 'var(--theme-page-text)', boxShadow: 'var(--theme-shadow-glass)' }}
                      itemStyle={{ color: '#3525cd', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#3525cd" strokeWidth={3} fillOpacity={1} fill="url(#scoreColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-surface-base/80 p-6 rounded-[2.5rem] border border-border-subtle backdrop-blur-lg flex flex-col relative overflow-hidden group shadow-glass">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-text-muted font-semibold text-sm uppercase tracking-widest relative z-10">نسبة حضور الفصل</h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-light tracking-tighter text-page-text">95.4%</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-success-bg flex items-center justify-center text-success-base">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="h-48 w-full relative z-10 min-h-[192px]" dir="ltr">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={attendanceData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="attendanceColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#006e4b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#006e4b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--theme-border)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--theme-text-light)', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--theme-text-light)', fontSize: 12 }} domain={[80, 100]} dx={-10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)', borderRadius: '1rem', color: 'var(--theme-page-text)', boxShadow: 'var(--theme-shadow-glass)' }}
                      itemStyle={{ color: '#006e4b', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="rate" stroke="#006e4b" strokeWidth={3} fillOpacity={1} fill="url(#attendanceColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            <div className="bg-surface-base/80 p-6 rounded-[2.5rem] border border-border-subtle backdrop-blur-lg flex flex-col relative overflow-hidden group shadow-glass hover:shadow-glass-hover transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center text-primary-base">
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-text-muted font-semibold text-sm mb-1 uppercase tracking-widest relative z-10">إجمالي الطلاب</h3>
              <div className="text-5xl font-light tracking-tighter text-page-text relative z-10">{classFilteredStudents.length}</div>
            </div>

            <div className="bg-surface-base/80 p-6 rounded-[2.5rem] border border-border-subtle backdrop-blur-lg flex flex-col relative overflow-hidden group shadow-glass hover:shadow-glass-hover transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-danger-bg flex items-center justify-center text-danger-base">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                {statsNeedsFollowUp > 0 && (
                  <span className="inline-flex items-center gap-1 bg-danger-bg text-danger-base border border-danger-base/20 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                    انتباه
                  </span>
                )}
              </div>
              <h3 className="text-text-muted font-semibold text-sm mb-1 uppercase tracking-widest relative z-10">يحتاجون متابعة</h3>
              <div className="text-5xl font-light tracking-tighter text-page-text relative z-10">{statsNeedsFollowUp}</div>
            </div>

            <div className="bg-surface-base/80 p-6 rounded-[2.5rem] border border-border-subtle backdrop-blur-lg flex flex-col relative overflow-hidden group shadow-glass hover:shadow-glass-hover transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-success-bg flex items-center justify-center text-success-base">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1 bg-success-bg text-success-base border border-success-base/20 px-3 py-1 rounded-full text-xs font-bold">
                  ممتاز
                </span>
              </div>
              <h3 className="text-text-muted font-semibold text-sm mb-1 uppercase tracking-widest relative z-10">الانضباط العام</h3>
              <div className="text-5xl font-light tracking-tighter text-page-text relative z-10">92%</div>
            </div>
          </div>

          <div className="bg-surface-base/80 backdrop-blur-xl border border-border-subtle rounded-[2.5rem] overflow-hidden shadow-glass relative flex-1">
            <div className="flex flex-col md:flex-row justify-between items-center p-6 border-b border-border-subtle bg-surface-base/50 gap-4">
              <h2 className="text-xl font-bold text-page-text flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary-base" /> قائمة الطلاب
              </h2>
              <div className="flex items-center gap-2 relative">
                <button 
                  onClick={() => setShowColumnsMenu(!showColumnsMenu)}
                  className="px-4 py-2 bg-surface-hover border border-border-subtle rounded-full text-sm font-medium text-page-text hover:bg-surface-active transition-colors flex items-center gap-2"
                >
                  <Settings2 className="w-4 h-4" />
                  <span className="hidden sm:inline">إعدادات الأعمدة</span>
                </button>
                
                {showColumnsMenu && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-surface-base border border-border-subtle rounded-2xl shadow-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                    <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-hover cursor-pointer transition-colors">
                      <input type="checkbox" checked={visibleColumns.className} onChange={() => setVisibleColumns({...visibleColumns, className: !visibleColumns.className})} className="rounded border-border-subtle text-primary-base focus:ring-primary-base bg-surface-base" />
                      <span className="text-sm">الفصل</span>
                    </label>
                    <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-hover cursor-pointer transition-colors">
                      <input type="checkbox" checked={visibleColumns.score} onChange={() => setVisibleColumns({...visibleColumns, score: !visibleColumns.score})} className="rounded border-border-subtle text-primary-base focus:ring-primary-base bg-surface-base" />
                      <span className="text-sm">النسبة</span>
                    </label>
                    <label className="flex items-center gap-3 px-4 py-2 hover:bg-surface-hover cursor-pointer transition-colors">
                      <input type="checkbox" checked={visibleColumns.performance} onChange={() => setVisibleColumns({...visibleColumns, performance: !visibleColumns.performance})} className="rounded border-border-subtle text-primary-base focus:ring-primary-base bg-surface-base" />
                      <span className="text-sm">التقييم</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-12 gap-4 p-4 text-xs font-semibold text-text-muted uppercase tracking-widest border-b border-border-subtle bg-surface-base/30 text-right pr-6">
                  <div className="col-span-1">ID</div>
                  <div className={`col-span-${studentSpan}`}>الطالب</div>
                  {visibleColumns.className && <div className="col-span-2">الفصل</div>}
                  {visibleColumns.score && <div className="col-span-2">الدرجة</div>}
                  {visibleColumns.performance && <div className="col-span-2">الحالة</div>}
                  <div className="col-span-1 text-center">إجراءات</div>
                </div>

                <div className="divide-y divide-border-subtle/50">
                  {filteredStudents.length === 0 ? (
                    <div className="p-8 text-center text-text-light flex flex-col items-center justify-center">
                      <Search className="w-12 h-12 mb-3 opacity-20" />
                      <p>لا توجد نتائج مطابقة للبحث</p>
                    </div>
                  ) : (
                    filteredStudents.map((student) => {
                      const isExpanded = expandedStudentId === student.docId;
                      
                      return (
                        <div key={student.docId} className="group relative">
                          {student.status === 'alert' && <div className="absolute right-0 top-0 bottom-0 w-1 bg-danger-base shadow-[0_0_10px_rgba(224,56,56,0.5)]"></div>}
                          <div 
                            className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors cursor-pointer pr-6 ${isExpanded ? 'bg-surface-active/30' : 'hover:bg-surface-hover/50'}`}
                            onClick={() => toggleExpand(student.docId)}
                          >
                            <div className="col-span-1 font-mono text-xs text-text-muted" dir="ltr">{student.id}</div>
                            
                            <div className={`col-span-${studentSpan} flex items-center gap-4`}>
                              <div className="w-10 h-10 rounded-full bg-surface-hover border border-border-subtle overflow-hidden flex items-center justify-center shrink-0">
                                {student.avatar ? (
                                  <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="font-bold text-text-muted">{student.name.charAt(0)}</span>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-page-text">{student.name}</div>
                                {student.status === 'alert' && (
                                  <div className="flex items-center gap-1 text-xs text-danger-base mt-0.5 font-medium">
                                    <AlertTriangle className="w-3 h-3" /> يحتاج لمتابعة عاجلة
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {visibleColumns.className && (
                              <div className="col-span-2">
                                <span className="px-3 py-1 bg-surface-hover border border-border-subtle rounded-full text-xs font-medium text-page-text">{student.className}</span>
                              </div>
                            )}
                            
                            {visibleColumns.score && (
                              <div className="col-span-2">
                                <div className="flex items-center gap-3">
                                  <div className="w-full bg-surface-hover rounded-full h-2 overflow-hidden border border-border-subtle/50 flex-1 max-w-[80px]" dir="ltr">
                                    <div className={`h-2 rounded-full ${getProgressColor(student.score)}`} style={{ width: `${student.score}%` }}></div>
                                  </div>
                                  <span className="font-mono text-sm font-bold text-page-text">{student.score}%</span>
                                </div>
                              </div>
                            )}

                            {visibleColumns.performance && (
                              <div className="col-span-2">
                                <span className={`px-3 py-1 border rounded-lg text-xs font-bold flex items-center w-fit gap-1.5 ${getStatusStyle(student.status)}`}>
                                  {student.status === 'alert' && <AlertTriangle className="w-3 h-3" />}
                                  {student.status === 'excellent' && <CheckCircle2 className="w-3 h-3" />}
                                  {student.performance}
                                </span>
                              </div>
                            )}

                            <div className="col-span-1 flex justify-center gap-2">
                              <button 
                                onClick={(e) => handleEditClick(student, e)} 
                                className="p-2 text-text-light hover:text-primary-base hover:bg-primary-bg rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Settings2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStudentToDelete(student.docId);
                                }} 
                                className="p-2 text-text-light hover:text-danger-base hover:bg-danger-bg rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="bg-surface-active/30 border-y border-border-subtle p-6 animate-in slide-in-from-top-2 duration-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                  <h4 className="text-sm font-bold text-page-text uppercase tracking-widest flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary-base" /> التفاصيل الإضافية
                                  </h4>
                                  <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-surface-base border border-border-subtle p-4 rounded-2xl">
                                      <div className="text-xs text-text-muted mb-1">الحضور</div>
                                      <div className="text-xl font-light">{student.attendance}%</div>
                                    </div>
                                    <div className="bg-surface-base border border-border-subtle p-4 rounded-2xl">
                                      <div className="text-xs text-text-muted mb-1">المشاركة</div>
                                      <div className="text-xl font-light">{student.participation}%</div>
                                    </div>
                                    <div className="bg-surface-base border border-border-subtle p-4 rounded-2xl">
                                      <div className="text-xs text-text-muted mb-1">الخصومات (درجات)</div>
                                      <div className="text-xl font-light text-danger-base">-{student.deductions}</div>
                                    </div>
                                  </div>
                                  
                                  {student.behavioralNotes && (
                                    <div className="bg-surface-hover/50 p-4 rounded-2xl border border-border-subtle mt-4">
                                      <span className="text-xs font-bold text-text-muted uppercase mb-2 block">ملاحظات سلوكية</span>
                                      <p className="text-sm text-page-text leading-relaxed">{student.behavioralNotes}</p>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="space-y-4">
                                  <h4 className="text-sm font-bold text-page-text uppercase tracking-widest flex items-center gap-2">
                                    <User className="w-4 h-4 text-primary-base" /> التواصل مع ولي الأمر
                                  </h4>
                                  <div className="bg-surface-base border border-border-subtle p-5 rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-text-muted">الاسم:</span>
                                      <span className="text-sm font-medium text-page-text">{student.contact?.parentName || 'غير متوفر'}</span>
                                    </div>
                                    <div className="h-px w-full bg-border-subtle/50"></div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-text-muted flex items-center gap-2"><Phone className="w-4 h-4" /> رقم الهاتف:</span>
                                      <a href={`tel:${student.contact?.parentPhone || ''}`} className="text-sm font-medium text-primary-base hover:underline" dir="ltr">{student.contact?.parentPhone || 'غير متوفر'}</a>
                                    </div>
                                  </div>
                                  <button className="w-full py-3 bg-surface-base border border-primary-base/30 text-primary-base hover:bg-primary-bg rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
                                    <Mail className="w-4 h-4" /> إرسال إشعار عبر النظام
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-base/50">
              <span className="text-sm text-text-muted">إجمالي: {filteredStudents.length} طالب</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

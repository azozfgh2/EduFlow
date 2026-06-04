import React, { useState } from 'react';
import { Search, Filter, Users, BarChart2, AlertTriangle, MoreVertical, ChevronRight, ChevronLeft, Download, Trash2, X, Phone, Mail, User, BookOpen, ChevronDown, ChevronUp, Settings2, UserPlus } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const initialStudents = [
  {
    id: "2023-0142",
    name: "ليلى أحمد محمود",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
    className: "10-أ",
    score: 96,
    performance: "ممتاز",
    status: "normal",
    contact: { phone: "0501234567", email: "laila.ahmed@school.edu", parentName: "أحمد محمود", parentPhone: "0559876543" },
    courses: [
      { name: "الرياضيات", grade: "A+", score: 98 },
      { name: "الفيزياء", grade: "A+", score: 95 },
      { name: "الأدب العربي", grade: "A", score: 92 }
    ]
  },
  {
    id: "2023-0188",
    name: "عمر خالد زيدان",
    avatar: null,
    className: "10-ب",
    score: 78,
    performance: "جيد",
    status: "normal",
    contact: { phone: "0507654321", email: "omar.khaled@school.edu", parentName: "خالد زيدان", parentPhone: "0551239876" },
    courses: [
      { name: "الرياضيات", grade: "B", score: 82 },
      { name: "الفيزياء", grade: "C+", score: 75 },
      { name: "الأدب العربي", grade: "B-", score: 79 }
    ]
  },
  {
    id: "2023-0211",
    name: "سامر طارق حسن",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop",
    className: "9-ج",
    score: 58,
    performance: "ضعيف",
    status: "alert",
    contact: { phone: "0501112233", email: "samer.tareq@school.edu", parentName: "طارق حسن", parentPhone: "0552223344" },
    courses: [
      { name: "الرياضيات", grade: "D", score: 55 },
      { name: "الفيزياء", grade: "F", score: 48 },
      { name: "الأدب العربي", grade: "C", score: 71 }
    ]
  }
];

const scoreData = [
  { name: 'الأسبوع 1', score: 75 },
  { name: 'الأسبوع 2', score: 78 },
  { name: 'الأسبوع 3', score: 82 },
  { name: 'الأسبوع 4', score: 81 },
  { name: 'الأسبوع 5', score: 85 },
  { name: 'الأسبوع 6', score: 87 }
];

const attendanceData = [
  { name: 'الأحد', rate: 98 },
  { name: 'الإثنين', rate: 96 },
  { name: 'الثلاثاء', rate: 94 },
  { name: 'الأربعاء', rate: 97 },
  { name: 'الخميس', rate: 92 }
];

const performanceEvolutionData = [
  { semester: 'الفصل 1 - 2022', score: 72 },
  { semester: 'الفصل 2 - 2022', score: 78 },
  { semester: 'الفصل 1 - 2023', score: 85 },
  { semester: 'الفصل 2 - 2023', score: 82 },
  { semester: 'الفصل 1 - 2024', score: 89 },
  { semester: 'الفصل 2 - 2024', score: 94 }
];

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText, isDanger }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-base w-full max-w-md rounded-3xl p-6 border border-border-subtle shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-page-text">{title}</h3>
          <button onClick={onCancel} className="text-text-light hover:text-page-text hover:bg-surface-hover p-1.5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-text-muted mb-8">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-5 py-2 rounded-full font-medium text-page-text hover:bg-surface-hover transition-colors">
            إلغاء
          </button>
          <button onClick={onConfirm} className={`px-5 py-2 rounded-full font-medium text-white transition-colors ${isDanger ? 'bg-danger-base hover:bg-danger-base/90' : 'bg-primary-base hover:bg-primary-base/90'}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function StudentsView() {
  const [students, setStudents] = useState(initialStudents);
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', id: '', className: '', score: '' });
  const [visibleColumns, setVisibleColumns] = useState({
    className: true,
    score: true,
    performance: true
  });

  const studentSpan = 11 - (visibleColumns.className ? 2 : 0) - (visibleColumns.score ? 2 : 0) - (visibleColumns.performance ? 2 : 0);
  const spanMap: Record<number, string> = {
    5: 'md:col-span-5',
    7: 'md:col-span-7',
    9: 'md:col-span-9',
    11: 'md:col-span-11'
  };
  const studentColSpanClass = spanMap[studentSpan] || 'md:col-span-5';

  const toggleExpand = (id: string) => {
    setExpandedStudentId(prev => prev === id ? null : id);
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    student.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ['رقم الطالب', 'الاسم', 'الفصل', 'نسبة النجاح', 'الأداء العام'];
    const csvContent = [
      headers.join(','),
      ...students.map(s => `"${s.id}","${s.name}","${s.className}","${s.score}%","${s.performance}"`)
    ].join('\n');

    // Add BOM for UTF-8 support in Excel
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportConfirm(false);
  };

  const handleDeleteStudent = () => {
    if (studentToDelete) {
      setStudents(students.filter(s => s.id !== studentToDelete));
      setStudentToDelete(null);
    }
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const scoreNum = Number(newStudent.score);
    const addedStudent = {
      id: newStudent.id,
      name: newStudent.name,
      className: newStudent.className,
      score: scoreNum,
      performance: scoreNum >= 90 ? 'ممتاز' : scoreNum >= 75 ? 'جيد' : 'ضعيف',
      status: scoreNum < 60 ? 'alert' : 'normal',
      avatar: null,
      contact: { phone: "غير متوفر", email: "غير متوفر", parentName: "غير متوفر", parentPhone: "غير متوفر" },
      courses: []
    };
    
    // Add to top of list
    setStudents([addedStudent as any, ...students]);
    setShowAddModal(false);
    setNewStudent({ name: '', id: '', className: '', score: '' });
  };

  return (
    <div className="animate-in fade-in duration-500">
      <ConfirmModal 
        isOpen={showExportConfirm}
        title="تأكيد التصدير"
        message="هل أنت متأكد من رغبتك في تصدير قائمة الطلاب والمقاييس الحالية إلى ملف CSV لسهولة الاحتفاظ بالسجلات؟"
        confirmText="نعم، تصدير"
        onConfirm={handleExportCSV}
        onCancel={() => setShowExportConfirm(false)}
        isDanger={false}
      />
      <ConfirmModal 
        isOpen={!!studentToDelete}
        title="حذف سجل الطالب"
        message="هل أنت متأكد من رغبتك في حذف سجل هذا الطالب؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف الطالب"
        onConfirm={handleDeleteStudent}
        onCancel={() => setStudentToDelete(null)}
        isDanger={true}
      />

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-base w-full max-w-lg rounded-3xl p-6 border border-border-subtle shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-page-text flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary-base" /> إضافة طالب جديد
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-text-light hover:text-page-text hover:bg-surface-hover p-1.5 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">اسم الطالب الرباعي</label>
                <input required type="text" value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})} className="w-full bg-surface-hover border border-border-subtle rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-base text-page-text leading-tight" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">الرقم الأكاديمي (ID)</label>
                  <input required type="text" value={newStudent.id} onChange={(e) => setNewStudent({...newStudent, id: e.target.value})} className="w-full bg-surface-hover border border-border-subtle rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-base text-page-text leading-tight" dir="ltr" placeholder="مثال: 2024-XXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">الفصل الدراسي</label>
                  <input required type="text" value={newStudent.className} onChange={(e) => setNewStudent({...newStudent, className: e.target.value})} className="w-full bg-surface-hover border border-border-subtle rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-base text-page-text leading-tight" placeholder="مثال: 10-أ" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">نسبة النجاح المتوقعة (%)</label>
                <input required type="number" min="0" max="100" value={newStudent.score} onChange={(e) => setNewStudent({...newStudent, score: e.target.value})} className="w-full bg-surface-hover border border-border-subtle rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-base text-page-text leading-tight" />
              </div>
              <div className="pt-4 flex justify-end gap-3 mt-4 border-t border-border-subtle">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-full font-medium text-page-text hover:bg-surface-hover transition-colors">إلغاء</button>
                <button type="submit" className="px-5 py-2.5 rounded-full bg-primary-base text-white hover:bg-primary-base/90 transition-colors font-medium cursor-pointer shadow-[var(--theme-shadow-primary-glow)]">تسجيل الطالب</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-2"><span className="font-bold text-transparent bg-clip-text bg-gradient-to-l from-page-text to-text-light">سجل الطلاب</span></h1>
          <p className="text-text-muted text-sm md:text-base">إدارة ومتابعة أداء جميع الطلاب في المدرسة.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-80 w-full">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-text-light" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-3 pr-10 py-3 border border-border-subtle rounded-full leading-5 bg-surface-base/50 text-page-text placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-base focus:border-primary-base sm:text-sm transition-all backdrop-blur-md shadow-sm"
              placeholder="البحث بالاسم أو رقم الجلوس..."
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative">
              <button 
                onClick={() => setShowColumnsMenu(!showColumnsMenu)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-surface-base/50 border border-border-subtle rounded-full text-page-text hover:bg-surface-hover backdrop-blur-md transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary-base focus:ring-offset-2 shadow-sm relative overflow-hidden"
              >
                <Settings2 className="w-5 h-5 relative z-10" />
                <span className="relative z-10 hidden md:inline">الأعمدة</span>
              </button>
              
              {showColumnsMenu && (
                <div className="absolute top-full mt-2 right-0 w-48 bg-surface-base border border-border-subtle rounded-2xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                    إظهار / إخفاء الأعمدة
                  </div>
                  <label className="flex items-center gap-3 px-3 py-2 hover:bg-surface-hover rounded-xl cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={visibleColumns.className} 
                      onChange={(e) => setVisibleColumns({...visibleColumns, className: e.target.checked})}
                      className="rounded border-border-subtle text-primary-base focus:ring-primary-base"
                    />
                    <span className="text-sm font-medium text-page-text">الفصل</span>
                  </label>
                  <label className="flex items-center gap-3 px-3 py-2 hover:bg-surface-hover rounded-xl cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={visibleColumns.score} 
                      onChange={(e) => setVisibleColumns({...visibleColumns, score: e.target.checked})}
                      className="rounded border-border-subtle text-primary-base focus:ring-primary-base"
                    />
                    <span className="text-sm font-medium text-page-text">نسبة النجاح</span>
                  </label>
                  <label className="flex items-center gap-3 px-3 py-2 hover:bg-surface-hover rounded-xl cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={visibleColumns.performance} 
                      onChange={(e) => setVisibleColumns({...visibleColumns, performance: e.target.checked})}
                      className="rounded border-border-subtle text-primary-base focus:ring-primary-base"
                    />
                    <span className="text-sm font-medium text-page-text">الأداء العام</span>
                  </label>
                </div>
              )}
            </div>
            
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-surface-base/50 border border-border-subtle rounded-full text-page-text hover:bg-surface-hover backdrop-blur-md transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary-base focus:ring-offset-2 shadow-sm relative overflow-hidden">
              <Filter className="w-5 h-5 relative z-10" />
              <span className="relative z-10 hidden md:inline">تصفية</span>
            </button>
            <button 
              onClick={() => setShowExportConfirm(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary-base text-white rounded-full hover:bg-primary-base/90 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary-base focus:ring-offset-2 shadow-[var(--theme-shadow-primary-glow)] relative overflow-hidden"
            >
              <Download className="w-5 h-5 relative z-10" />
              <span className="relative z-10 whitespace-nowrap hidden md:inline">تصدير</span>
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex-1 sm:flex-none md:mr-2 flex items-center justify-center gap-2 px-6 py-3 bg-surface-base border border-primary-base/30 text-primary-base rounded-full hover:bg-primary-bg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary-base focus:ring-offset-2 shadow-sm relative overflow-hidden"
            >
              <UserPlus className="w-5 h-5 relative z-10" />
              <span className="relative z-10 whitespace-nowrap hidden lg:inline">إضافة طالب</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
        <div className="bg-surface-base/80 p-6 rounded-[2.5rem] border border-border-subtle backdrop-blur-lg flex flex-col relative overflow-hidden group shadow-glass">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-text-muted font-semibold text-sm uppercase tracking-widest relative z-10">متوسط درجات الطلاب</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-light tracking-tighter text-page-text">82%</span>
                <span className="text-sm font-medium text-success-base bg-success-bg px-2 py-0.5 rounded-full">+4.2%</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-bg flex items-center justify-center text-primary-base">
              <BarChart2 className="w-5 h-5" />
            </div>
          </div>
          <div className="h-48 w-full relative z-10" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
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
              <h3 className="text-text-muted font-semibold text-sm uppercase tracking-widest relative z-10">نسبة الحضور الأسبوعية</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-light tracking-tighter text-page-text">95.4%</span>
                <span className="text-sm font-medium text-danger-base bg-danger-bg px-2 py-0.5 rounded-full">-1.2%</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-success-bg flex items-center justify-center text-success-base">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="h-48 w-full relative z-10" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
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

      <div className="bg-surface-base/80 p-6 rounded-[2.5rem] border border-border-subtle backdrop-blur-lg flex flex-col relative overflow-hidden group shadow-glass mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-text-muted font-semibold text-sm uppercase tracking-widest relative z-10">تطور الأداء الأكاديمي للطلاب (عبر الفصول)</h3>
          </div>
        </div>
        <div className="h-64 w-full relative z-10" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceEvolutionData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--theme-border)" />
              <XAxis dataKey="semester" axisLine={false} tickLine={false} tick={{ fill: 'var(--theme-text-light)', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--theme-text-light)', fontSize: 12 }} domain={[60, 100]} dx={-10} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)', borderRadius: '1rem', color: 'var(--theme-page-text)', boxShadow: 'var(--theme-shadow-glass)' }}
                itemStyle={{ color: 'var(--theme-primary)', fontWeight: 'bold' }}
              />
              <Line type="monotone" dataKey="score" stroke="var(--theme-primary)" strokeWidth={3} dot={{ fill: 'var(--theme-primary)', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-surface-base/80 p-6 rounded-[2.5rem] border border-border-subtle backdrop-blur-lg flex flex-col relative overflow-hidden group shadow-glass hover:shadow-glass-hover transition-shadow">
          <div className="absolute -left-6 -top-6 w-24 h-24 bg-primary-bg rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center text-primary-base">
              <Users className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 bg-primary-bg text-primary-base border border-primary-base/20 px-2.5 py-1 rounded-full text-xs font-medium">
              +12 هذا الشهر
            </span>
          </div>
          <h3 className="text-text-muted font-semibold text-sm mb-1 uppercase tracking-widest relative z-10">إجمالي الطلاب</h3>
          <div className="text-5xl font-light tracking-tighter text-page-text relative z-10">1,248</div>
        </div>

        <div className="bg-surface-base/80 p-6 rounded-[2.5rem] border border-border-subtle backdrop-blur-lg flex flex-col relative overflow-hidden group shadow-glass hover:shadow-glass-hover transition-shadow">
          <div className="absolute -left-6 -top-6 w-24 h-24 bg-success-bg rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center text-success-base">
              <BarChart2 className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 bg-success-bg text-success-base border border-success-base/20 px-2.5 py-1 rounded-full text-xs font-medium">
              +2.4%
            </span>
          </div>
          <h3 className="text-text-muted font-semibold text-sm mb-1 uppercase tracking-widest relative z-10">متوسط نسبة النجاح</h3>
          <div className="text-5xl font-light tracking-tighter text-page-text relative z-10">87%</div>
        </div>

        <div className="bg-surface-base/80 p-6 rounded-[2.5rem] border border-danger-base/30 flex flex-col relative overflow-hidden group shadow-glass hover:shadow-glass-hover transition-shadow">
          <div className="absolute -left-6 -top-6 w-24 h-24 bg-danger-bg rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-danger-bg flex items-center justify-center text-danger-base">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 bg-surface-hover text-text-muted border border-border-subtle px-2.5 py-1 rounded-full text-xs font-medium">
              تنبيهات
            </span>
          </div>
          <h3 className="text-danger-base font-semibold text-sm mb-1 uppercase tracking-widest relative z-10">يحتاجون لمتابعة</h3>
          <div className="text-5xl font-light tracking-tighter text-danger-base relative z-10">42</div>
        </div>
      </div>

      <div className="bg-surface-base/80 backdrop-blur-xl border border-border-subtle rounded-[2rem] overflow-hidden flex flex-col shadow-glass">
        <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-5 border-b border-border-subtle bg-surface-hover/50 text-sm tracking-widest text-text-muted uppercase">
          <div className={studentColSpanClass}>الطالب</div>
          {visibleColumns.className && <div className="col-span-2 text-center">الفصل</div>}
          {visibleColumns.score && <div className="col-span-2 text-center">نسبة النجاح</div>}
          {visibleColumns.performance && <div className="col-span-2">الأداء العام</div>}
          <div className="col-span-1"></div>
        </div>

        <div>
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <React.Fragment key={student.id}>
                <div 
                  onClick={() => toggleExpand(student.id)}
                  className={`group flex flex-col md:grid md:grid-cols-12 gap-4 p-5 md:px-8 md:py-6 items-center border-[1px] md:border-y-0 md:border-b border-border-subtle cursor-pointer transition-all ${
                    student.status === 'alert' 
                      ? 'active:bg-danger-bg bg-danger-bg hover:bg-danger-bg/80 md:border-r-[4px] md:border-r-danger-base' 
                      : 'hover:bg-surface-hover active:bg-surface-active'
                  } ${expandedStudentId === student.id ? (student.status === 'alert' ? 'bg-danger-bg/80' : 'bg-surface-hover') : ''}`}
                >
                  <div className={`w-full ${studentColSpanClass} flex items-center gap-4`}>
                    {student.avatar ? (
                      <img src={student.avatar} alt={student.name} className={`w-12 h-12 rounded-full object-cover border shrink-0 ${student.status === 'alert' ? 'border-danger-base/30' : 'border-border-subtle'}`} />
                    ) : (
                      <div className="w-12 h-12 rounded-full border border-border-subtle flex items-center justify-center font-bold text-lg shrink-0 bg-surface-hover text-page-text">
                        {student.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className={`font-medium transition-colors flex items-center gap-1.5 text-lg ${
                        student.status === 'alert' 
                          ? 'text-page-text group-hover:text-danger-base' 
                          : 'text-page-text group-hover:text-primary-base'
                      }`}>
                        {student.name}
                        {student.status === 'alert' && <AlertTriangle className="w-4 h-4 text-danger-base" />}
                      </h4>
                      <p className="text-xs text-text-light mt-1 tracking-wider uppercase">ID: {student.id}</p>
                    </div>
                  </div>
                  {visibleColumns.className && (
                    <div className="w-full md:col-span-2 flex justify-between md:justify-center items-center">
                      <span className="md:hidden text-sm text-text-light font-medium">الفصل:</span>
                      <span className={`text-sm font-medium px-4 py-1.5 rounded-full shadow-sm border ${
                        student.status === 'alert'
                          ? 'bg-danger-bg text-danger-base border-danger-base/20'
                          : 'bg-surface-hover text-page-text border-border-subtle'
                      }`}>{student.className}</span>
                    </div>
                  )}
                  {visibleColumns.score && (
                    <div className="w-full md:col-span-2 flex justify-between md:justify-center items-center">
                      <span className="md:hidden text-sm text-text-light font-medium">النسبة:</span>
                      <span className={`text-xl font-light ${student.status === 'alert' ? 'text-danger-base' : 'text-primary-base'}`}>
                        {student.score}%
                      </span>
                    </div>
                  )}
                  {visibleColumns.performance && (
                    <div className="w-full md:col-span-2 flex justify-between md:justify-start items-center gap-3">
                      <span className="md:hidden text-sm text-text-light font-medium">الأداء:</span>
                      <div className="flex-1 md:max-w-full flex items-center gap-3">
                        <div className="h-2 flex-1 bg-surface-active rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              student.status === 'alert' 
                                ? 'bg-danger-base shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                                : 'bg-primary-base shadow-[var(--theme-shadow-primary-glow)]'
                            }`} 
                            style={{ width: `${student.score}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-text-muted text-left w-12">{student.performance}</span>
                      </div>
                    </div>
                  )}
                  <div className="hidden md:flex col-span-1 justify-end gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setStudentToDelete(student.id); }}
                      className={`p-2 rounded-full transition-colors ${
                        student.status === 'alert'
                          ? 'text-danger-base/70 hover:text-danger-base hover:bg-danger-base/10'
                          : 'text-text-light hover:text-danger-base hover:bg-danger-bg'
                      }`}>
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button className={`p-2 rounded-full transition-colors ${
                      student.status === 'alert'
                        ? 'text-danger-base/70 hover:text-danger-base hover:bg-danger-base/10'
                        : 'text-text-light hover:text-page-text hover:bg-surface-active'
                    }`}>
                      {expandedStudentId === student.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {expandedStudentId === student.id && (
                  <div className={`p-6 md:p-8 border-b border-border-subtle animate-in slide-in-from-top-2 duration-200 ${student.status === 'alert' ? 'bg-danger-bg/30' : 'bg-surface-hover/30'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h5 className="flex items-center gap-2 text-page-text font-semibold mb-4">
                          <User className="w-5 h-5 text-primary-base" />
                          معلومات التواصل
                        </h5>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-full bg-surface-base flex items-center justify-center text-text-light shrink-0">
                              <Phone className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-text-muted text-xs">رقم هاتف الطالب</p>
                              <p className="text-page-text font-medium" dir="ltr">{student.contact.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-full bg-surface-base flex items-center justify-center text-text-light shrink-0">
                              <Mail className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-text-muted text-xs">البريد الإلكتروني</p>
                              <p className="text-page-text font-medium">{student.contact.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-full bg-surface-base flex items-center justify-center text-text-light shrink-0">
                              <Users className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-text-muted text-xs">ولي الأمر: {student.contact.parentName}</p>
                              <p className="text-page-text font-medium" dir="ltr">{student.contact.parentPhone}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="flex items-center gap-2 text-page-text font-semibold mb-4">
                          <BookOpen className="w-5 h-5 text-primary-base" />
                          السجل الأكاديمي الحالي
                        </h5>
                        <div className="bg-surface-base rounded-2xl border border-border-subtle overflow-hidden">
                          {student.courses.map((course, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 border-b border-border-subtle last:border-0 hover:bg-surface-hover transition-colors">
                              <span className="text-sm font-medium text-page-text">{course.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-text-muted">{course.score}%</span>
                                <span className={`text-sm font-bold w-8 text-center rounded-md ${
                                  course.score >= 90 ? 'bg-success-bg text-success-base' :
                                  course.score >= 70 ? 'bg-primary-bg text-primary-base' :
                                  'bg-danger-bg text-danger-base'
                                }`}>
                                  {course.grade}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))
          ) : (
          <div className="p-8 text-center text-text-light flex flex-col items-center justify-center gap-2">
            <Search className="w-8 h-8 opacity-20" />
            <p>لا توجد نتائج مطابقة للبحث</p>
          </div>
        )}
        </div>

        <div className="px-8 py-5 flex justify-between items-center bg-surface-hover/50">
          <span className="text-sm font-medium text-text-muted">عرض 1-3 من 1,248</span>
          <div className="flex gap-1">
            <button className="p-2 rounded-full text-text-light hover:text-page-text hover:bg-surface-hover transition-colors disabled:opacity-30" disabled>
              <ChevronRight className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-full bg-primary-bg text-primary-base font-bold border border-primary-bg flex items-center justify-center transition-transform hover:scale-105 shadow-[var(--theme-shadow-primary-glow)]">1</button>
            <button className="w-10 h-10 rounded-full text-text-light hover:bg-surface-hover hover:text-page-text font-medium flex items-center justify-center transition-colors">2</button>
            <button className="w-10 h-10 rounded-full text-text-light hover:bg-surface-hover hover:text-page-text font-medium flex items-center justify-center transition-colors hidden sm:flex">3</button>
            <span className="w-10 h-10 text-text-light flex items-center justify-center font-bold hidden sm:flex">...</span>
            <button className="p-2 rounded-full text-text-light hover:text-page-text hover:bg-surface-hover transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

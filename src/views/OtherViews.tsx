import React, { useState } from 'react';
import { Clock, MapPin, User, CheckCircle2, Circle, Calendar as CalendarIcon, MessageSquare, Send, Plus, BookOpen, Presentation, Coffee } from 'lucide-react';

export function ScheduleView() {
  const scheduleItems = [
    { id: 1, time: '08:00 ص - 09:30 ص', subject: 'الرياضيات المتقدمة', grade: 'الصف العاشر', room: 'القاعة 101', icon: BookOpen, color: 'text-primary-base', bg: 'bg-primary-bg' },
    { id: 2, time: '09:45 ص - 11:15 ص', subject: 'الفيزياء والتجارب', grade: 'الصف العاشر', room: 'مختبر العلوم', icon: Presentation, color: 'text-success-base', bg: 'bg-success-bg' },
    { id: 3, time: '11:15 ص - 11:45 ص', subject: 'استراحة', grade: 'الجميع', room: 'الكافتيريا', icon: Coffee, color: 'text-text-muted', bg: 'bg-surface-active' },
    { id: 4, time: '11:45 ص - 01:15 م', subject: 'الأدب العربي', grade: 'الصف الحادي عشر', room: 'القاعة 204', icon: BookOpen, color: 'text-primary-base', bg: 'bg-primary-bg' },
  ];

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-2"><span className="font-bold text-transparent bg-clip-text bg-gradient-to-l from-page-text to-text-light">الجدول الدراسي</span></h1>
          <p className="text-text-muted text-sm md:text-base">جدول حصص اليوم (الثلاثاء)</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-surface-base border border-border-subtle rounded-full text-page-text hover:bg-surface-hover transition-colors shadow-sm font-medium">
          <CalendarIcon className="w-5 h-5" />
          <span className="hidden sm:inline">تغيير اليوم</span>
        </button>
      </div>

      <div className="relative border-r-2 border-border-subtle pr-6 ml-4 space-y-8 mt-4">
        {scheduleItems.map((item) => (
          <div key={item.id} className="relative group">
            <div className={`absolute -right-[35px] top-1 w-6 h-6 rounded-full border-4 border-page-bg ${item.bg} ${item.color} flex items-center justify-center`}>
              <Circle className="w-2 h-2 fill-current" />
            </div>
            <div className="bg-surface-base/80 backdrop-blur-xl border border-border-subtle rounded-3xl p-6 shadow-glass hover:shadow-glass-hover transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-page-text mb-1">{item.subject}</h3>
                  <div className="flex items-center gap-3 text-sm text-text-muted">
                    <span className="flex items-center gap-1"><User className="w-4 h-4" /> {item.grade}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {item.room}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-surface-hover px-4 py-2 rounded-xl border border-border-subtle">
                <Clock className="w-4 h-4 text-primary-base" />
                <span className="font-medium text-page-text" dir="ltr">{item.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TasksView() {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'تصحيح أوراق اختبار الفيزياء للشهر الأول', deadline: 'اليوم', completed: false },
    { id: 2, title: 'إعداد خطة الدرس للأسبوع القادم', deadline: 'غداً', completed: false },
    { id: 3, title: 'مراجعة طلبات نقل الطلاب (الفصل ب)', deadline: '١٢ أكتوبر', completed: true },
    { id: 4, title: 'تجهيز معدات المختبر لحصة الكيمياء', deadline: '١٥ أكتوبر', completed: false },
  ]);
  const [newTask, setNewTask] = useState('');

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks([{ id: Date.now(), title: newTask, deadline: 'غير محدد', completed: false }, ...tasks]);
    setNewTask('');
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = Math.round((completedCount / tasks.length) * 100) || 0;

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-2"><span className="font-bold text-transparent bg-clip-text bg-gradient-to-l from-page-text to-text-light">المهام والاختبارات</span></h1>
          <p className="text-text-muted text-sm md:text-base">إدارة مهامك اليومية والواجبات.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={addTask} className="relative flex items-center">
            <input 
              type="text" 
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="أضف مهمة جديدة..." 
              className="w-full bg-surface-base/80 backdrop-blur-xl border border-border-subtle rounded-2xl py-4 pr-4 pl-14 text-page-text placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-base shadow-glass"
            />
            <button type="submit" className="absolute left-2 w-10 h-10 bg-primary-base text-white rounded-xl flex items-center justify-center hover:bg-primary-base/90 transition-transform hover:scale-105">
              <Plus className="w-5 h-5" />
            </button>
          </form>

          <div className="space-y-3">
            {tasks.map(task => (
              <div 
                key={task.id} 
                onClick={() => toggleTask(task.id)}
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${task.completed ? 'bg-surface-active/50 border-border-subtle opacity-70' : 'bg-surface-base border-border-subtle shadow-sm hover:border-primary-base/30'}`}
              >
                <div className="flex items-center gap-4">
                  <button className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${task.completed ? 'bg-success-base text-white' : 'border-2 border-text-light text-transparent'}`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <span className={`font-medium ${task.completed ? 'text-text-muted line-through' : 'text-page-text'}`}>{task.title}</span>
                </div>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-surface-hover text-text-muted border border-border-subtle">{task.deadline}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-base/80 backdrop-blur-xl border border-border-subtle rounded-3xl p-6 shadow-glass h-fit">
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
      </div>
    </div>
  );
}

export function DiscussionsView() {
  const [messages, setMessages] = useState([
    { id: 1, author: 'إدارة المدرسة', role: 'admin', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop', time: '١٠:٤٥ صباحاً', content: 'نذكر جميع المعلمين باجتماع الهيئة التدريسية غداً الساعة ١ ظهراً في القاعة الرئيسية. يرجى إحضار تقارير الأداء الشهرية.' },
    { id: 2, author: 'أ. محمود', role: 'teacher', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', time: 'أمس', content: 'هل يمكن لأحد أن يغطي حصتي السادسة غداً في فصل ١٠-أ؟ لدي ظرف طارئ ولن أتمكن من الحضور.' }
  ]);
  const [newMsg, setNewMsg] = useState('');

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if(!newMsg.trim()) return;
    setMessages([...messages, {
      id: Date.now(),
      author: 'أنت (EduFlow)',
      role: 'me',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
      time: 'الآن',
      content: newMsg
    }]);
    setNewMsg('');
  };

  return (
    <div className="flex flex-col gap-6 w-full h-[calc(100vh-140px)] animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-2"><span className="font-bold text-transparent bg-clip-text bg-gradient-to-l from-page-text to-text-light">النقاشات المجتمعية</span></h1>
        <p className="text-text-muted text-sm md:text-base">تواصل مع المعلمين وإدارة المدرسة بحرية.</p>
      </div>

      <div className="bg-surface-base/80 backdrop-blur-xl border border-border-subtle rounded-3xl flex flex-col shadow-glass flex-1 min-h-[400px] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => {
            const isMe = msg.role === 'me';
            return (
              <div key={msg.id} className={`flex gap-4 max-w-[85%] ${isMe ? 'mr-auto flex-row-reverse' : 'ml-auto'}`}>
                <img src={msg.avatar} alt={msg.author} className="w-10 h-10 rounded-full object-cover border border-border-subtle shrink-0" />
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-sm font-semibold text-page-text">{msg.author}</span>
                    <span className="text-xs text-text-light">{msg.time}</span>
                  </div>
                  <div className={`p-4 rounded-2xl ${isMe ? 'bg-primary-base text-white rounded-tr-none' : 'bg-surface-hover text-page-text rounded-tl-none border border-border-subtle'}`}>
                    <p className="leading-relaxed text-sm md:text-base">{msg.content}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-surface-base border-t border-border-subtle">
          <form onSubmit={sendMessage} className="flex items-center gap-3">
            <input 
              type="text" 
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              placeholder="اكتب رسالتك للمجموعة..."
              className="flex-1 bg-surface-hover border border-border-subtle rounded-full py-3 px-5 text-page-text placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-base"
            />
            <button type="submit" disabled={!newMsg.trim()} className="w-12 h-12 bg-primary-base text-white rounded-full flex items-center justify-center shrink-0 hover:bg-primary-base/90 transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:hover:bg-primary-base">
              <Send className="w-5 h-5 rtl:-scale-x-100" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

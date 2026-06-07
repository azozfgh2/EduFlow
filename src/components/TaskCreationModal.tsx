import React, { useState, useRef } from 'react';
import { X, Plus, Trash2, Paperclip, Image as ImageIcon, Video, Mic, Settings, FileText, CheckSquare, AlignLeft, Upload, PlayCircle, Eye, Loader2, Send } from 'lucide-react';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherClasses: any[];
  userId: string;
  initialTaskType: string;
  userProfile?: any;
}

export function TaskCreationModal({ isOpen, onClose, teacherClasses, userId, initialTaskType, userProfile }: TaskCreationModalProps) {
  const [activeTab, setActiveTab] = useState<'questions' | 'settings' | 'preview'>('questions');
  const [taskType, setTaskType] = useState(initialTaskType || 'assignment'); // assignment, project, test
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxGrade, setMaxGrade] = useState(10);
  const [duration, setDuration] = useState(30); // for tests only
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  
  const [submissionType, setSubmissionType] = useState('questions'); // questions, files (for assignments/projects)
  const [questions, setQuestions] = useState<any[]>([{ id: Date.now(), type: 'multiple_choice', question: '', options: ['خيار 1'], correctOptionIndex: 0, attachmentUrl: '', attachmentType: '', isUploading: false, points: 1, required: true }]);
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(questions[0].id);

  React.useEffect(() => {
    if (isOpen) {
      setTaskType(initialTaskType || 'assignment');
      if (initialTaskType === 'assignment') {
        setTitle('واجب جديد');
      } else if (initialTaskType === 'test') {
        setTitle('اختبار جديد');
      } else {
        setTitle('مشروع جديد');
      }
    }
  }, [initialTaskType, isOpen]);

  if (!isOpen) return null;

  const getTaskColor = () => {
    if (taskType === 'test') return '#006e4b';
    if (taskType === 'assignment') return '#3525cd';
    if (taskType === 'project') return '#f59e0b';
    return '#673AB7';
  };

  const getTaskBg = () => {
    if (taskType === 'test') return '#006e4b1a';
    if (taskType === 'assignment') return '#3525cd1a';
    if (taskType === 'project') return '#f59e0b1a';
    return '#673AB71a';
  };

  const taskColor = getTaskColor();
  const taskBg = getTaskBg();

  const handleAddQuestion = () => {
    const newId = Date.now();
    setQuestions([...questions, { id: newId, type: 'multiple_choice', question: '', options: ['خيار 1'], correctOptionIndex: 0, attachmentUrl: '', attachmentType: '', isUploading: false }]);
    setActiveQuestionId(newId);
  };

  const handleUpdateQuestion = (id: number, field: string, value: any) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleRemoveQuestion = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuestions(questions.filter(q => q.id !== id));
    if (activeQuestionId === id) setActiveQuestionId(null);
  };

  const compressImage = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1280;
          const MAX_HEIGHT = 1280;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.8);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, questionId: number) => {
    let file = e.target.files?.[0];
    if (!file) return;
    
    handleUpdateQuestion(questionId, 'isUploading', true);

    try {
      if (file.type.startsWith('image/')) {
        file = await compressImage(file);
      }

      if (file.size > 1024 * 1024) { // 1MB limit for Firestore
        alert('حجم الملف كبير جداً. الحد الأقصى هو 1 ميغابايت.');
        handleUpdateQuestion(questionId, 'isUploading', false);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        let type = '';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.startsWith('audio/')) type = 'audio';
        
        handleUpdateQuestion(questionId, 'attachmentUrl', dataUrl);
        handleUpdateQuestion(questionId, 'attachmentType', type);
        handleUpdateQuestion(questionId, 'isUploading', false);
      };
      reader.onerror = () => {
        alert('حدث خطأ أثناء قراءة الملف.');
        handleUpdateQuestion(questionId, 'isUploading', false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File upload failed:', error);
      alert('فشل رفع الملف. يرجى المحاولة مرة أخرى.');
      handleUpdateQuestion(questionId, 'isUploading', false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedClasses.length === 0) {
      alert('يرجى التأكد من إدخال العنوان وتحديد فصل واحد على الأقل من الإعدادات');
      setActiveTab('settings');
      return;
    }

    try {
      // Check Plan Limits
      const plan = userProfile?.plan || 'free';
      const q = query(collection(db, 'tasks'), where('userId', '==', userId));
      const snaps = await getDocs(q);
      const allTasks = snaps.docs.map(d => d.data());
      
      const now = new Date();
      if (plan === 'free') {
        // limit 15 tasks per month
        const thisMonth = allTasks.filter((t: any) => t.createdAt?.toDate?.() && t.createdAt.toDate().getMonth() === now.getMonth() && t.createdAt.toDate().getFullYear() === now.getFullYear());
        if (thisMonth.length + selectedClasses.length > 15) {
           alert('تجاوزت الحد المسموح في الخطة المجانية (15 مهمة في الشهر). الرجاء ترقية الخطة.');
           return;
        }
      } else if (plan === 'pro') {
        const todayStr = now.toDateString();
        const todayTasks = allTasks.filter((t: any) => t.createdAt?.toDate?.() && t.createdAt.toDate().toDateString() === todayStr);
        if (todayTasks.length + selectedClasses.length > 20) {
           alert('تجاوزت الحد اليومي للخطة برو (20 مهمة في اليوم).');
           return;
        }
      }

      const taskData: any = {
        title,
        description,
        type: taskType,
        userId,
        startDate,
        deadline: endDate,
        maxGrade: Number(maxGrade),
        completedBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (taskType === 'test' || submissionType === 'questions') {
        taskData.submissionType = 'questions';
        taskData.questions = questions.map(q => {
          const cleanQ = { ...q };
          delete cleanQ.isUploading;
          return cleanQ;
        });
      } else {
        taskData.submissionType = 'files';
      }

      if (taskType === 'test') {
        taskData.duration = Number(duration);
      }

      for (const classCode of selectedClasses) {
        await addDoc(collection(db, 'tasks'), { ...taskData, classCode });
      }
      
      alert('تم إنشاء ونشر العمل بنجاح!');
      onClose();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const getTaskTypeName = () => {
    if (taskType === 'assignment') return 'واجب';
    if (taskType === 'project') return 'مشروع';
    if (taskType === 'test') return 'اختبار';
    return '';
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-surface-base overflow-hidden">
      {/* Google Forms-like Header */}
      <div className="bg-white border-b border-border-subtle flex flex-col pt-3 shadow-sm shrink-0">
        <div className="flex justify-between items-center px-6 pb-2">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg" style={{ backgroundColor: taskBg, color: taskColor }}>
                <FileText className="w-6 h-6" />
             </div>
             <input 
               type="text"
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               placeholder={`نموذج ${getTaskTypeName()} بدون عنوان`}
               className="text-xl font-medium bg-transparent border-b border-transparent hover:border-border-subtle focus:outline-none transition-colors py-1 truncate max-w-md"
               style={{ outlineColor: taskColor, borderColor: title ? 'transparent' : 'gray' }}
               onFocus={(e) => e.target.style.borderColor = taskColor}
               onBlur={(e) => e.target.style.borderColor = 'transparent'}
             />
          </div>
          <div className="flex items-center gap-4">
             <button onClick={onClose} className="text-text-muted hover:bg-surface-hover p-2 rounded-full border border-border-subtle bg-surface-hover/50">
               <X className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-end justify-between px-6 pt-2">
          <div className="w-[120px]"></div> {/* Spacer */}
          <div className="flex justify-center gap-8">
            <button 
               onClick={() => setActiveTab('questions')} 
               className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'questions' ? '' : 'text-text-muted hover:text-page-text'}`}
               style={{ color: activeTab === 'questions' ? taskColor : undefined }}
            >
              الأسئلة
              {activeTab === 'questions' && <span className="absolute bottom-0 left-0 right-0 h-1 rounded-t-md" style={{ backgroundColor: taskColor }} />}
            </button>
            <button 
               onClick={() => setActiveTab('settings')} 
               className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'settings' ? '' : 'text-text-muted hover:text-page-text'}`}
               style={{ color: activeTab === 'settings' ? taskColor : undefined }}
            >
              الإعدادات
              {activeTab === 'settings' && <span className="absolute bottom-0 left-0 right-0 h-1 rounded-t-md" style={{ backgroundColor: taskColor }} />}
            </button>
            <button 
               onClick={() => setActiveTab('preview')} 
               className={`pb-3 font-medium text-sm transition-colors relative flex items-center gap-1 ${activeTab === 'preview' ? '' : 'text-text-muted hover:text-page-text'}`}
               style={{ color: activeTab === 'preview' ? taskColor : undefined }}
            >
              <Eye className="w-4 h-4" /> معاينة
              {activeTab === 'preview' && <span className="absolute bottom-0 left-0 right-0 h-1 rounded-t-md" style={{ backgroundColor: taskColor }} />}
            </button>
          </div>
          <div className="w-[120px] pb-2 flex justify-end">
             <button type="button" onClick={handleSubmit} className="px-6 py-2 rounded-lg font-bold transition-colors text-white shadow-sm flex items-center gap-2 hover:opacity-90" style={{ backgroundColor: taskColor }}>
               <Send className="w-4 h-4 rtl:-scale-x-100" />
               نشر
             </button>
          </div>
        </div>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-3xl mx-auto py-8 px-4 flex gap-4 items-start relative">
          
          <div className="flex-1 space-y-4">
            {activeTab === 'settings' ? (
              <div className="bg-white rounded-xl border border-border-subtle p-6 shadow-sm space-y-6">
                <div>
                  <h4 className="font-bold text-page-text border-b border-border-subtle pb-4 mb-6">إعدادات {getTaskTypeName()}</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">الفصول المستهدفة *</label>
                  <div className="flex flex-wrap gap-2">
                    {teacherClasses.map(cls => (
                      <label key={cls.id} className="flex items-center gap-2 bg-surface-hover border border-border-subtle rounded-xl px-4 py-2 cursor-pointer transition-colors"
                        style={{ borderColor: selectedClasses.includes(cls.code) ? taskColor : undefined }}
                      >
                        <input 
                          type="checkbox" 
                          className="rounded-md"
                          style={{ accentColor: taskColor }}
                          checked={selectedClasses.includes(cls.code)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedClasses([...selectedClasses, cls.code]);
                            else setSelectedClasses(selectedClasses.filter(c => c !== cls.code));
                          }}
                        />
                        <span className="text-sm font-medium">{cls.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">وصف النموذج (اختياري)</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-surface-base border-b border-border-subtle px-0 py-2 focus:outline-none min-h-[60px]" placeholder="أدخل وصفاً للنموذج..." style={{ outlineColor: taskColor }} onFocus={(e) => e.target.style.borderColor = taskColor} onBlur={(e) => e.target.style.borderColor = 'transparent'} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">تاريخ البدء *</label>
                    <input type="datetime-local" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-surface-hover border border-border-subtle rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1" style={{ outlineColor: taskColor }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">تاريخ الانتهاء *</label>
                    <input type="datetime-local" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-surface-hover border border-border-subtle rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1" style={{ outlineColor: taskColor }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">الدرجة الكبرى *</label>
                    <input type="number" required min="0" value={maxGrade} onChange={e => setMaxGrade(e.target.value as any)} className="w-full bg-surface-hover border border-border-subtle rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1" style={{ outlineColor: taskColor }} />
                  </div>
                  {taskType === 'test' && (
                    <div>
                      <label className="block text-sm font-medium text-text-muted mb-1">المدة (بالدقائق) *</label>
                      <input type="number" required min="1" value={duration} onChange={e => setDuration(e.target.value as any)} className="w-full bg-surface-hover border border-border-subtle rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1" style={{ outlineColor: taskColor }} />
                    </div>
                  )}
                </div>

                {(taskType === 'assignment' || taskType === 'project') && (
                  <div className="pt-4">
                    <label className="block text-sm font-medium text-text-muted mb-2">طريقة تسليم الطالب</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer bg-surface-hover p-3 rounded-xl border border-border-subtle">
                        <input type="radio" style={{ accentColor: taskColor }} checked={submissionType === 'questions'} onChange={() => setSubmissionType('questions')} />
                        <span>حل أسئلة داخل المنصة</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer bg-surface-hover p-3 rounded-xl border border-border-subtle">
                        <input type="radio" style={{ accentColor: taskColor }} checked={submissionType === 'files'} onChange={() => setSubmissionType('files')} />
                        <span>إرفاق رابط للملفات الخارجية</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === 'preview' ? (
              <div className="bg-white rounded-xl border border-border-subtle shadow-sm space-y-6 overflow-hidden">
                <div className="h-3 w-full" style={{ backgroundColor: taskColor }} />
                <div className="px-8 pb-8">
                  <div className="text-center border-b border-border-subtle pb-6 mb-8">
                    <h2 className="text-3xl font-bold text-page-text mb-3">{title || `نموذج ${getTaskTypeName()} بدون عنوان`}</h2>
                    {description && <p className="text-text-muted whitespace-pre-wrap">{description}</p>}
                  </div>
                  
                  {submissionType === 'files' ? (
                    <div className="text-center py-8">
                      <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium text-text-muted">سيطُلب من الطالب إرفاق ملفاته هنا</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {questions.map((q, i) => (
                        <div key={q.id} className="space-y-4 bg-surface-hover/30 p-6 rounded-2xl border border-border-subtle">
                          <h3 className="text-lg font-bold text-page-text flex items-start gap-3">
                            <span className="text-text-light">{i + 1}.</span>
                            <span>
                              {q.question || 'سؤال بدون عنوان'}
                              {q.required !== false && <span className="text-danger-base mr-1">*</span>}
                            </span>
                          </h3>
                          
                          {q.attachmentUrl && (
                            <div className="mt-4 mb-6">
                              {q.attachmentType === 'image' && <img src={q.attachmentUrl} className="max-h-96 rounded-xl shadow-sm border border-border-subtle mx-auto" />}
                              {q.attachmentType === 'video' && <video src={q.attachmentUrl} controls className="max-h-96 rounded-xl shadow-sm border border-border-subtle w-full mx-auto" />}
                              {q.attachmentType === 'audio' && <audio src={q.attachmentUrl} controls className="w-full max-w-lg shadow-sm mx-auto" />}
                            </div>
                          )}
                          
                          {q.type === 'text' ? (
                            <div className="mt-4">
                              <input disabled placeholder="إجابة الطالب ستكون هنا..." className="w-full bg-white border border-border-subtle rounded-xl px-4 py-3 opacity-60 cursor-not-allowed" />
                            </div>
                          ) : (
                            <div className="space-y-3 mt-4">
                              {q.options.map((opt: string, optIndex: number) => (
                                <label key={optIndex} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border-subtle cursor-not-allowed opacity-70">
                                  <input disabled type="radio" className="w-5 h-5 focus:ring-0" style={{ accentColor: taskColor }} />
                                  <span className="font-medium text-page-text">{opt || `خيار ${optIndex + 1}`}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* QUESTIONS TAB */
              <div className="space-y-4 pb-20">
                {/* Title Card */}
                <div className="bg-white rounded-xl border border-border-subtle shadow-sm overflow-hidden pt-2 relative">
                  <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: taskColor }} />
                  <div className="p-6">
                    <input 
                      type="text" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      placeholder={`نموذج ${getTaskTypeName()} بدون عنوان`} 
                      className="w-full text-3xl font-normal bg-transparent border-b border-border-subtle hover:border-gray-400 focus:outline-none transition-colors py-2 mb-4" 
                      style={{ borderBottomColor: title ? undefined : 'gray' }}
                      onFocus={(e) => e.target.style.borderBottomColor = taskColor}
                    />
                    <textarea 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                      placeholder="وصف النموذج" 
                      className="w-full bg-transparent border-b border-border-subtle hover:border-gray-400 focus:outline-none transition-colors py-1 min-h-[40px] text-sm text-text-muted" 
                      onFocus={(e) => e.target.style.borderBottomColor = taskColor}
                    />
                  </div>
                </div>

                {submissionType === 'files' ? (
                  <div className="bg-white rounded-xl border border-border-subtle p-8 shadow-sm text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: taskColor, opacity: 0.5 }} />
                    <h3 className="text-xl font-bold mb-2">طريقة التسليم: ملفات خارجية</h3>
                    <p className="text-text-muted">سيقوم الطلاب بإرفاق روابط لتسليم هذا العمل بدلاً من الإجابة على أسئلة.</p>
                  </div>
                ) : (
                  questions.map((q, index) => {
                    const isActive = activeQuestionId === q.id;
                    return (
                      <div 
                        key={q.id} 
                        onClick={() => setActiveQuestionId(q.id)}
                        className={`bg-white rounded-xl border transition-all duration-200 shadow-sm relative ${isActive ? 'border-l-4' : 'border-border-subtle hover:border-gray-300'}`}
                        style={{ borderLeftColor: isActive ? taskColor : undefined, borderColor: isActive ? taskColor : undefined }}
                      >
                        <div className="p-6">
                          <div className="flex gap-4 items-start mb-6 w-full">
                            <div className="flex-1">
                              <input 
                                value={q.question}
                                onChange={e => handleUpdateQuestion(q.id, 'question', e.target.value)}
                                placeholder="سؤال بدون عنوان"
                                className={`w-full text-base font-normal bg-surface-hover/50 px-4 py-3 rounded-t-md border-b-2 ${isActive ? '' : 'border-gray-300 hover:border-gray-400'} focus:outline-none transition-colors`} 
                                style={{ borderBottomColor: isActive ? taskColor : undefined }}
                              />
                            </div>
                            
                            {isActive && (
                              <div className="flex items-center gap-2">
                                <label className="cursor-pointer text-text-muted p-2 bg-surface-hover rounded-md transition-colors" title="إرفاق ملف"
                                  style={{ color: taskColor }}
                                >
                                  {q.isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                                  <input type="file" accept="image/*,video/*,audio/*" className="hidden" onChange={(e) => handleFileUpload(e, q.id)} disabled={q.isUploading} />
                                </label>
                                <select 
                                  value={q.type}
                                  onChange={e => handleUpdateQuestion(q.id, 'type', e.target.value)}
                                  className="bg-white border text-sm border-gray-300 rounded-md px-3 py-2.5 focus:outline-none"
                                  style={{ outlineColor: taskColor }}
                                >
                                  <option value="multiple_choice">خيارات متعددة</option>
                                  <option value="text">إجابة قصيرة</option>
                                </select>
                              </div>
                            )}
                          </div>

                          {/* Attachment Preview */}
                          {q.attachmentUrl && (
                            <div className="mb-6 relative inline-block group">
                              {q.attachmentType === 'image' && <img src={q.attachmentUrl} alt="مرفق" className="max-h-64 rounded-md border border-gray-200" />}
                              {q.attachmentType === 'video' && <video src={q.attachmentUrl} controls className="max-h-64 rounded-md border border-gray-200" />}
                              {q.attachmentType === 'audio' && <audio src={q.attachmentUrl} controls className="w-full max-w-sm rounded-md border border-gray-200" />}
                              
                              {isActive && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleUpdateQuestion(q.id, 'attachmentUrl', ''); handleUpdateQuestion(q.id, 'attachmentType', ''); }}
                                  className="absolute top-2 right-2 bg-white/90 text-danger-base p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-danger-base/20"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}

                          {/* Answers Area */}
                          {q.type === 'text' ? (
                            <div className="border-b border-gray-300 border-dashed pb-2 w-1/2">
                              <span className="text-gray-400 text-sm">نص الإجابة القصيرة</span>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {q.options.map((opt: string, optIndex: number) => (
                                <div key={optIndex} className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                  <input 
                                    value={opt}
                                    onChange={e => {
                                      const newOpts = [...q.options];
                                      newOpts[optIndex] = e.target.value;
                                      handleUpdateQuestion(q.id, 'options', newOpts);
                                    }}
                                    placeholder={`خيار رقم ${optIndex + 1}`}
                                    className={`flex-1 bg-transparent border-b ${isActive ? 'hover:border-gray-300 focus:outline-none' : 'border-transparent'} py-1 transition-colors`} 
                                    style={{ borderBottomColor: isActive ? taskColor : undefined }}
                                  />
                                  {isActive && q.options.length > 1 && (
                                    <button 
                                      type="button" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const newOpts = q.options.filter((_: any, i: number) => i !== optIndex);
                                        handleUpdateQuestion(q.id, 'options', newOpts);
                                        if (q.correctOptionIndex === optIndex) handleUpdateQuestion(q.id, 'correctOptionIndex', 0);
                                        else if (q.correctOptionIndex > optIndex) handleUpdateQuestion(q.id, 'correctOptionIndex', q.correctOptionIndex - 1);
                                      }} 
                                      className="text-gray-400 hover:text-gray-600 p-1"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                                  
                                  {/* Answer Key Toggle for Teachers (available for all types of choice tasks now) */}
                                  {isActive && (
                                    <label className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md cursor-pointer transition-colors ${q.correctOptionIndex === optIndex ? 'bg-success-bg text-success-base font-bold' : 'bg-surface-hover text-text-muted hover:bg-gray-200'}`} title="تحديد كإجابة صحيحة">
                                      <input 
                                        type="radio" 
                                        name={`correct-${q.id}`}
                                        checked={q.correctOptionIndex === optIndex}
                                        onChange={() => handleUpdateQuestion(q.id, 'correctOptionIndex', optIndex)}
                                        className="hidden" 
                                      />
                                      {q.correctOptionIndex === optIndex ? <CheckSquare className="w-3.5 h-3.5" /> : 'إجابة صحيحة'}
                                    </label>
                                  )}
                                </div>
                              ))}
                              
                              {isActive && (
                                <div className="flex items-center gap-3 mt-2 pr-1">
                                  <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleUpdateQuestion(q.id, 'options', [...q.options, `خيار ${q.options.length + 1}`]); }}
                                    className="text-gray-400 hover:text-gray-600 border-b border-transparent hover:border-gray-300 py-1"
                                  >
                                    إضافة خيار
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Question Footer (Actions) */}
                        {isActive && (
                          <div className="bg-white border-t border-gray-100 p-3 px-6 rounded-b-xl flex justify-between items-center gap-2">
                             <div className="flex items-center gap-4">
                               <label className="flex items-center gap-2 text-sm text-text-muted">
                                 <span>النقاط</span>
                                 <input
                                   type="number"
                                   min="0"
                                   value={q.points !== undefined ? q.points : 1}
                                   onChange={(e) => handleUpdateQuestion(q.id, 'points', Number(e.target.value))}
                                   className="w-16 border border-border-subtle rounded-md px-2 py-1 text-center focus:outline-none"
                                   style={{ outlineColor: taskColor }}
                                 />
                               </label>
                             </div>
                             <div className="flex items-center gap-4 border-r border-gray-200 pr-4">
                               <label className="flex items-center gap-2 text-sm font-medium cursor-pointer" title="مطلوب">
                                  <span className={q.required !== false ? "text-danger-base font-bold" : "text-text-muted"}>مطلوب {q.required !== false ? '*' : ''}</span>
                                  <input 
                                    type="checkbox"
                                    checked={q.required !== false}
                                    onChange={(e) => handleUpdateQuestion(q.id, 'required', e.target.checked)}
                                    className="rounded-md w-4 h-4"
                                    style={{ accentColor: taskColor }}
                                  />
                               </label>
                               <button type="button" onClick={(e) => handleRemoveQuestion(q.id, e)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors" title="حذف">
                                 <Trash2 className="w-5 h-5" />
                               </button>
                             </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {/* Floating Action Bar (Like Google Forms) */}
          {activeTab === 'questions' && submissionType !== 'files' && (
            <div className="sticky top-8 bg-white border border-border-subtle rounded-xl shadow-sm flex flex-col p-2 gap-2 mt-2">
              <button onClick={handleAddQuestion} className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-colors" title="إضافة سؤال" style={{ color: taskColor }}>
                <Plus className="w-6 h-6" />
              </button>
              
              <div className="w-6 h-px bg-gray-200 mx-auto my-1" />
              
              <label className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer" title="إضافة صورة" style={{ color: taskColor }}>
                <ImageIcon className="w-5 h-5" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => activeQuestionId && handleFileUpload(e, activeQuestionId)} />
              </label>
              
              <label className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer" title="إضافة فيديو" style={{ color: taskColor }}>
                <PlayCircle className="w-5 h-5" />
                <input type="file" accept="video/*" className="hidden" onChange={(e) => activeQuestionId && handleFileUpload(e, activeQuestionId)} />
              </label>
              
              <label className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer" title="إضافة صوت" style={{ color: taskColor }}>
                <Mic className="w-5 h-5" />
                <input type="file" accept="audio/*" className="hidden" onChange={(e) => activeQuestionId && handleFileUpload(e, activeQuestionId)} />
              </label>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
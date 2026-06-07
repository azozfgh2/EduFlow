import React, { useState, useEffect } from 'react';
import { X, User, CheckCircle, Clock } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';

interface TaskReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
}

export function TaskReviewModal({ isOpen, onClose, task }: TaskReviewModalProps) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [students, setStudents] = useState<Record<string, any>>({});
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  useEffect(() => {
    if (!isOpen || !task) return;

    // Fetch submissions
    const q = query(collection(db, `tasks/${task.docId}/submissions`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach(d => items.push({ docId: d.id, ...d.data() }));
      setSubmissions(items);
    });

    return () => unsubscribe();
  }, [isOpen, task]);

  // Fetch student details for submissions
  useEffect(() => {
    if (submissions.length === 0) return;
    const fetchStudents = async () => {
      const studentData: Record<string, any> = {};
      for (const sub of submissions) {
        if (!students[sub.userId]) {
          const userDoc = await getDoc(doc(db, 'users', sub.userId));
          if (userDoc.exists()) studentData[sub.userId] = userDoc.data();
        }
      }
      if (Object.keys(studentData).length > 0) {
        setStudents(prev => ({ ...prev, ...studentData }));
      }
    };
    fetchStudents();
  }, [submissions]);

  if (!isOpen || !task) return null;

  const handleGradeSubmission = async (grade: number) => {
    if(!selectedSubmission) return;
    try {
      await updateDoc(doc(db, `tasks/${task.docId}/submissions`, selectedSubmission.docId), { grade });
      // Update local state temporarily out of convenience before snapshot triggers
      setSelectedSubmission({ ...selectedSubmission, grade });
      alert('تم حفظ الدرجة');
    } catch(err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ الدرجة');
    }
  }

  const getTaskColor = () => {
    if (task.type === 'test') return '#006e4b';
    if (task.type === 'assignment') return '#3525cd';
    if (task.type === 'project') return '#f59e0b';
    return '#673AB7';
  };
  const taskColor = getTaskColor();

  const renderSubmissionDetails = () => {
    if (!selectedSubmission) return null;
    const student = students[selectedSubmission.userId];
    
    return (
      <div className="flex flex-col h-full bg-surface-base">
        <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-surface-hover/50">
          <div className="flex items-center gap-3">
             <button onClick={() => setSelectedSubmission(null)} className="md:hidden p-2 text-text-muted hover:bg-surface-hover rounded-full">
               <X className="w-5 h-5 rtl:-scale-x-100" />
             </button>
             <div className="w-12 h-12 rounded-full bg-primary-bg text-primary-base flex items-center justify-center font-bold text-lg">
                {student?.name?.charAt(0) || <User className="w-6 h-6" />}
             </div>
             <div>
               <h4 className="font-bold text-lg text-page-text">{student?.name || 'طالب مجهول'}</h4>
               <p className="text-sm text-text-muted flex items-center gap-1">
                 <Clock className="w-3 h-3" />
                 تم التسليم: {selectedSubmission.submittedAt?.toDate().toLocaletoLocaleString('ar') || 'غير معروف'}
               </p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-surface-base border border-border-subtle rounded-xl px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary-base">
              <span className="text-text-muted text-sm">الدرجة:</span>
              <input 
                type="number" 
                max={task.maxGrade} 
                min={0}
                value={selectedSubmission.grade || ''} 
                onChange={(e) => handleGradeSubmission(Number(e.target.value))}
                className="w-16 bg-transparent text-center font-bold text-primary-base focus:outline-none"
                placeholder="-"
              />
              <span className="text-text-muted text-sm border-r border-border-subtle pr-2 mr-1">/ {task.maxGrade}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {task.submissionType === 'files' ? (
            <div className="bg-surface-hover p-8 rounded-3xl border border-border-subtle text-center">
              <h5 className="font-bold mb-6 text-xl">الملف المرفق للتسليم</h5>
              
              {selectedSubmission.filesUrl ? (
                <div className="inline-block relative">
                  {selectedSubmission.fileType === 'image' && <img src={selectedSubmission.filesUrl} alt="مرفق الطالب" className="max-h-96 rounded-2xl shadow-sm border border-border-subtle" />}
                  {selectedSubmission.fileType === 'video' && <video src={selectedSubmission.filesUrl} controls className="max-h-96 w-full rounded-2xl shadow-sm border border-border-subtle mx-auto" />}
                  {selectedSubmission.fileType === 'audio' && <audio src={selectedSubmission.filesUrl} controls className="w-full max-w-lg mx-auto" />}
                  {(!selectedSubmission.fileType || selectedSubmission.fileType === 'document') && (
                     <a href={selectedSubmission.filesUrl} download="submission" className="inline-block text-white px-8 py-3 rounded-full font-bold transition-colors shadow-sm" style={{ backgroundColor: taskColor }}>
                       تحميل الملف
                     </a>
                  )}
                </div>
              ) : (
                <p className="text-text-muted italic">لا يوجد ملف مرفق</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {task.questions?.map((q: any, i: number) => {
                const studentAnswer = selectedSubmission.answers?.[q.id];
                const isCorrect = q.type === 'multiple_choice' ? q.options[q.correctOptionIndex] === studentAnswer : null;
                
                return (
                  <div key={q.id} className="bg-surface-base border border-border-subtle p-5 rounded-2xl shadow-sm">
                    <div className="font-bold text-page-text mb-4 pb-3 border-b border-border-subtle flex justify-between items-start gap-4">
                      <div>
                        <span className="ml-2" style={{ color: taskColor }}>{i + 1}.</span>
                        {q.question}
                      </div>
                      {q.points !== undefined && (
                         <span className="text-sm font-medium text-text-muted bg-surface-hover px-2 py-0.5 rounded-md border border-border-subtle whitespace-nowrap">
                           {q.points} {q.points === 1 ? 'نقطة' : 'نقاط'}
                         </span>
                      )}
                    </div>
                    
                    <div className="pl-4">
                      <h6 className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">إجابة الطالب:</h6>
                      {q.type === 'text' ? (
                        <p className="text-page-text whitespace-pre-wrap bg-surface-hover p-4 rounded-xl border border-border-subtle">{studentAnswer || <span className="text-text-light italic">لم يُجب</span>}</p>
                      ) : (
                        <div className={`p-4 rounded-xl border flex items-center justify-between ${isCorrect === true ? 'bg-success-bg/30 border-success-base text-success-base' : isCorrect === false ? 'bg-danger-bg/30 border-danger-base text-danger-base' : 'bg-surface-hover border-border-subtle'}`}>
                          <span className="font-medium">{studentAnswer || 'لم يُجب'}</span>
                          {isCorrect === true && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
                          {isCorrect === false && <X className="w-5 h-5 flex-shrink-0" />}
                        </div>
                      )}
                      
                      {q.type === 'multiple_choice' && isCorrect === false && (
                         <div className="mt-3 p-3 bg-success-bg/20 rounded-lg border border-success-base/30 text-sm flex items-center gap-2">
                           <span className="text-success-base font-bold">الإجابة الصحيحة:</span>
                           <span className="text-page-text">{q.options[q.correctOptionIndex]}</span>
                         </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-base w-full max-w-6xl h-[85vh] rounded-3xl border border-border-subtle shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-border-subtle shrink-0">
          <div>
            <h3 className="text-xl font-bold text-page-text">مراجعة: {task.title}</h3>
            <p className="text-sm text-text-muted mt-1">الردود المستلمة: {submissions.length}</p>
          </div>
          <button onClick={onClose} className="text-text-light hover:text-page-text hover:bg-surface-hover p-1.5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar list of students */}
          <div className={`w-full md:w-80 border-l border-border-subtle overflow-y-auto ${selectedSubmission ? 'hidden md:block' : 'block'}`}>
            {submissions.length === 0 ? (
              <div className="p-8 text-center text-text-muted">
                لا توجد تسليمات حتى الآن.
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {submissions.map((sub) => {
                  const s = students[sub.userId];
                  const hasGraded = sub.grade !== undefined;
                  return (
                    <button 
                      key={sub.docId}
                      onClick={() => setSelectedSubmission(sub)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors text-right ${selectedSubmission?.docId === sub.docId ? 'bg-primary-bg border border-primary-base/30' : 'hover:bg-surface-hover border border-transparent'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-text-muted">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="font-bold text-page-text text-sm">{s?.name || '...'}</span>
                          <span className="text-xs text-text-muted mt-0.5">{hasGraded ? 'تم التقييم' : 'بانتظار التقييم'}</span>
                        </div>
                      </div>
                      {hasGraded && (
                        <div className="bg-success-bg text-success-base px-2 py-0.5 rounded-md text-xs font-bold border border-success-base/20">
                          {sub.grade}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Main review area */}
          <div className="flex-1 overflow-hidden bg-surface-base">
            {selectedSubmission ? renderSubmissionDetails() : (
              <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50 p-8 text-center hidden md:flex">
                 <CheckCircle className="w-16 h-16 mb-4" />
                 <p>اختر تسليماً من القائمة الجانبية للمراجعة والتقييم.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

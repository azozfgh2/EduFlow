import React, { useState } from 'react';
import { X, Send, Paperclip } from 'lucide-react';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

interface TaskSolveModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  userId: string;
}

export function TaskSolveModal({ isOpen, onClose, task, userId }: TaskSolveModalProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [filesUrl, setFilesUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  if (!isOpen || !task) return null;

  const getTaskColor = () => {
    if (task.type === 'test') return '#006e4b';
    if (task.type === 'assignment') return '#3525cd';
    if (task.type === 'project') return '#f59e0b';
    return '#673AB7';
  };
  const taskColor = getTaskColor();

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    setIsUploading(true);

    try {
      if (file.type.startsWith('image/')) {
        file = await compressImage(file);
      }

      if (file.size > 1024 * 1024) {
        alert('حجم الملف كبير جداً. الحد الأقصى هو 1 ميغابايت.');
        setIsUploading(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setFilesUrl(dataUrl);
        
        let type = '';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.startsWith('audio/')) type = 'audio';
        else type = 'document';
        setFileType(type);
        setIsUploading(false);
      };
      
      reader.onerror = () => {
        alert('حدث خطأ أثناء قراءة الملف.');
        setIsUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload failed', error);
      alert('فشل رفع الملف، يرجى المحاولة مرة أخرى.');
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (task.submissionType === 'questions') {
      const unansweredRequired = task.questions?.find((q: any) => q.required !== false && !answers[q.id]);
      if (unansweredRequired) {
        alert('يوجد أسئلة مطلوبة لم تقم بالإجابة عليها.');
        return;
      }
    }
    
    try {
      // Create submission
      await addDoc(collection(db, `tasks/${task.docId}/submissions`), {
        userId,
        answers: task.submissionType === 'questions' ? answers : {},
        filesUrl: task.submissionType === 'files' ? filesUrl : '',
        fileType: task.submissionType === 'files' ? fileType : '',
        submittedAt: serverTimestamp(),
      });

      // Update completedBy tracking
      const completedBy = task.completedBy || [];
      if (!completedBy.includes(userId)) {
        completedBy.push(userId);
        await updateDoc(doc(db, 'tasks', task.docId), { completedBy });
      }

      alert('تم إرسال إجابتك بنجاح');
      onClose();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الإرسال');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-xl border border-border-subtle shadow-xl my-8 h-fit relative overflow-hidden flex flex-col">
        <div className="h-3 w-full shrink-0" style={{ backgroundColor: taskColor }} />
        
        <button onClick={onClose} type="button" className="absolute top-6 left-6 text-text-muted hover:text-page-text hover:bg-surface-hover p-2 rounded-full transition-colors z-10 bg-white shadow-sm border border-border-subtle inline-flex">
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="px-8 pb-8 pt-8">
          <div className="text-center border-b border-border-subtle pb-6 mb-8">
            <h2 className="text-3xl font-bold text-page-text mb-3">{task.title}</h2>
            {task.description && <p className="text-text-muted whitespace-pre-wrap">{task.description}</p>}
            <p className="text-sm text-text-muted mt-3 inline-block bg-surface-hover px-3 py-1 rounded-full">{task.type === 'test' ? 'اختبار' : 'مهمة / واجب'} - الدرجة الكبرى: {task.maxGrade}</p>
          </div>

          {task.submissionType === 'questions' ? (
            <div className="space-y-8">
              {task.questions?.map((q: any, i: number) => (
                <div key={q.id} className="space-y-4 bg-surface-hover/30 p-6 rounded-2xl border border-border-subtle">
                  <div className="font-bold text-page-text flex justify-between items-start gap-4">
                    <h3 className="text-lg font-bold text-page-text flex items-start gap-3">
                      <span className="text-text-light">{i + 1}.</span>
                      <span>
                        {q.question}
                        {q.required !== false && <span className="text-danger-base mr-1">*</span>}
                      </span>
                    </h3>
                    {q.points !== undefined && (
                       <span className="text-sm font-medium text-text-muted bg-white px-2 py-0.5 rounded-md border border-border-subtle whitespace-nowrap shadow-sm">
                         {q.points} {q.points === 1 ? 'نقطة' : 'نقاط'}
                       </span>
                    )}
                  </div>
                  
                  {q.attachmentUrl && (
                    <div className="mt-4 mb-6">
                      {q.attachmentType === 'image' && <img src={q.attachmentUrl} alt="Attachment" className="max-h-96 rounded-xl shadow-sm border border-border-subtle mx-auto" />}
                      {q.attachmentType === 'video' && <video src={q.attachmentUrl} controls className="max-h-96 rounded-xl shadow-sm border border-border-subtle w-full mx-auto" />}
                      {q.attachmentType === 'audio' && <audio src={q.attachmentUrl} controls className="w-full max-w-lg shadow-sm mx-auto" />}
                    </div>
                  )}

                  <div className="pt-2">
                    {q.type === 'text' ? (
                      <textarea 
                        required={q.required !== false}
                        className="w-full bg-white border border-border-subtle rounded-xl px-4 py-3 focus:outline-none focus:ring-1 min-h-[100px] shadow-sm"
                        style={{ outlineColor: taskColor }}
                        onFocus={(e) => { e.target.style.borderColor = taskColor; e.target.style.boxShadow = `0 0 0 1px ${taskColor}`; }}
                        onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                        placeholder="إجابتك ستكون هنا..."
                        value={answers[q.id] || ''}
                        onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                      />
                    ) : (
                      <div className="space-y-3 mt-4">
                        {q.options?.map((opt: string, optIdx: number) => (
                          <label key={optIdx} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border-subtle cursor-pointer hover:border-gray-300 transition-colors shadow-sm" style={{ borderColor: answers[q.id] === opt ? taskColor : undefined, backgroundColor: answers[q.id] === opt ? `${taskColor}15` : undefined }}>
                            <input 
                              type="radio" 
                              name={`q-${q.id}`}
                              required={q.required !== false}
                              checked={answers[q.id] === opt}
                              onChange={() => setAnswers({...answers, [q.id]: opt})}
                              style={{ accentColor: taskColor }}
                              className="w-5 h-5 focus:ring-0"
                            />
                            <span className="font-medium text-page-text">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-base border border-border-subtle p-8 rounded-3xl shadow-sm text-center">
              <Paperclip className="w-16 h-16 text-primary-base/50 mx-auto mb-4" />
              <h4 className="font-bold text-page-text text-xl mb-2">إرفاق ملفات التسليم</h4>
              <p className="text-sm text-text-muted mb-8">قم باختيار ملف من جهازك لإرفاقه كحل (صورة، فيديو، صوت)</p>
              
              {isUploading ? (
                <div className="flex items-center gap-3 justify-center text-primary-base font-bold bg-primary-bg px-8 py-3 rounded-full mx-auto inline-flex">
                  <div className="w-5 h-5 border-2 border-primary-base border-t-transparent rounded-full animate-spin" />
                  جاري الرفع...
                </div>
              ) : filesUrl ? (
                <div className="mb-6 relative inline-block group">
                  {fileType === 'image' && <img src={filesUrl} alt="مرفق" className="max-h-64 rounded-xl border border-border-subtle shadow-sm" />}
                  {fileType === 'video' && <video src={filesUrl} controls className="max-h-64 rounded-xl border border-border-subtle shadow-sm mx-auto" />}
                  {fileType === 'audio' && <audio src={filesUrl} controls className="w-full max-w-sm rounded-xl border border-border-subtle shadow-sm mx-auto" />}
                  {fileType === 'document' && (
                     <div className="bg-surface-hover p-4 rounded-xl border border-border-subtle">
                       <span className="font-bold text-page-text">{fileName}</span>
                     </div>
                  )}
                  <button 
                    type="button"
                    onClick={() => { setFilesUrl(''); setFileName(''); setFileType(''); }}
                    className="absolute -top-3 -right-3 bg-white text-danger-base p-2 rounded-full shadow-md hover:bg-danger-bg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer inline-flex items-center gap-2 bg-primary-base text-white px-8 py-3 rounded-full font-bold hover:bg-primary-base/90 transition-colors shadow-sm">
                  <Paperclip className="w-5 h-5 rtl:-scale-x-100" />
                  اختيار ملف
                  <input 
                    type="file" 
                    onChange={handleFileUpload}
                    className="hidden" 
                    accept="image/*,video/*,audio/*" 
                  />
                </label>
              )}
            </div>
          )}

          <div className="pt-8 mt-8 border-t border-border-subtle flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-full font-medium text-page-text hover:bg-surface-hover transition-colors">إلغاء</button>
            <button type="submit" className="flex items-center gap-2 px-8 py-2.5 rounded-full text-white transition-colors font-bold shadow-sm hover:opacity-90" style={{ backgroundColor: taskColor }}>
              <Send className="w-4 h-4 rtl:-scale-x-100" />
              إرسال الإجابة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

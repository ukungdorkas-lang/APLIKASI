import React, { useState, useRef } from 'react';
import { Upload, X, File, Image as ImageIcon, Video, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

interface FileUploadProps {
  onUploadSuccess: (url: string) => void;
  allowedTypes?: string[];
  maxSize?: number; // in MB
  label?: string;
  initialUrl?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onUploadSuccess, 
  allowedTypes = [
    'image/*', 
    'application/pdf', 
    '.pdf',
    'video/*', 
    'application/msword', 
    '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
    '.docx',
    'application/vnd.ms-powerpoint', 
    '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', 
    '.pptx',
    'application/vnd.ms-excel', 
    '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
    '.xlsx',
    'application/zip', 
    '.zip',
    'application/x-zip-compressed', 
    'application/x-rar-compressed', 
    '.rar',
    'application/vnd.rar'
  ],
  maxSize = 5,
  label = "Unggah Dokumen / Media",
  initialUrl
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync preview with initialUrl when it changes (e.g., when editing different items)
  React.useEffect(() => {
    if (!file) {
      setPreview(initialUrl || null);
    }
  }, [initialUrl, file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Type validation
    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return selected.type.startsWith(type.replace('/*', ''));
      }
      return selected.type === type;
    });

    if (!isAllowed) {
      setError('Format file tidak didukung');
      return;
    }

    // Size validation
    if (selected.size > maxSize * 1024 * 1024) {
      setError(`Ukuran file terlalu besar (Maks ${maxSize}MB)`);
      return;
    }

    setFile(selected);
    setError(null);

    // Preview for images
    if (selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }

    // Simulate Upload immediately for this prototype
    startSimulatedUpload(selected);
  };

    const startSimulatedUpload = async (file: File) => {
      setUploading(true);
      setProgress(10);
      
      const fileName = Date.now() + "-" + file.name.replace(/([^\\w.-])/g, "_");
      setTimeout(() => setProgress(30), 100);
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const fileData = reader.result;
          const response = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileName, fileData })
          });
          const resData = await response.json();
          if (!response.ok || !resData.success) throw new Error(resData.error || "Upload failed");
          setProgress(100);
          setPreview(file.type.startsWith("image/") ? resData.fileUrl : null);
          setTimeout(() => {
            onUploadSuccess(resData.fileUrl);
            setUploading(false);
          }, 300);
        } catch (err: any) {
          console.warn("Storage fallback triggered. File will be saved locally/base64.");
          if (file.type.startsWith("image/")) {
            const img = new Image();
            img.onload = () => {
               const canvas = document.createElement("canvas");
               const ctx = canvas.getContext("2d");
               const MAX_WIDTH = 800;
               const MAX_HEIGHT = 800;
               let width = img.width;
               let height = img.height;
               if (width > height) {
                 if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
               } else {
                 if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
               }
               canvas.width = width;
               canvas.height = height;
               ctx?.drawImage(img, 0, 0, width, height);
               onUploadSuccess(canvas.toDataURL("image/jpeg", 0.7));
               setUploading(false);
               setProgress(100);
            };
            img.src = reader.result as string;
          } else if (file.size < 5 * 1024 * 1024) {
               onUploadSuccess(reader.result as string);
               setUploading(false);
               setProgress(100);
          } else {
            setUploading(false);
            setProgress(0);
            alert("Upload Error: Failed to fetch (Ukuran terlalu besar atau koneksi server gagal)");
          }
        }
      };
      reader.readAsDataURL(file);
    };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setProgress(0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{label}</label>
      
      {!file && !preview ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-4 border-dashed border-slate-200 rounded-[2rem] p-10 flex flex-col items-center justify-center cursor-pointer hover:border-brand-red hover:bg-red-50/50 transition-all group"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept={allowedTypes.join(',')}
          />
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white group-hover:scale-110 transition-all shadow-sm">
            <Upload className="w-8 h-8 text-slate-400 group-hover:text-brand-red" />
          </div>
          <p className="text-sm font-black italic uppercase tracking-tighter text-slate-400 group-hover:text-brand-dark">Pilih File dari Penyimpanan</p>
          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-2 px-6 py-2 bg-slate-50 rounded-full">Gallery • File Manager • Computer</p>
        </div>
      ) : (
        <div className="bg-white border-4 border-slate-900 rounded-[2rem] p-6 relative overflow-hidden group">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept={allowedTypes.join(',')}
          />
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border-2 border-slate-100">
              {preview ? (
                <img src={preview} className="w-full h-full object-cover" />
              ) : file?.type.startsWith('video/') ? (
                <Video className="w-8 h-8 text-slate-400" />
              ) : (
                <File className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black italic uppercase tracking-tighter truncate leading-none mb-1">{file ? file.name : 'Media Terpilih'}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB • ${file.type.split('/')[1].toUpperCase()}` : 'Pratinjau Media'}
              </p>
            </div>
            {!uploading && (
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all"
                  title="Ganti File"
                >
                  <Upload className="w-5 h-5" />
                </button>
                <button 
                  type="button"
                  onClick={removeFile}
                  className="p-3 bg-red-50 text-brand-red rounded-xl hover:bg-brand-red hover:text-white transition-all"
                  title="Hapus"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <AnimatePresence>
            {uploading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }}
                className="mt-6 pt-6 border-t-2 border-slate-50"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-brand-red animate-pulse">Mengunggah...</span>
                  <span className="text-[10px] font-black italic">{progress}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-brand-red"
                  />
                </div>
              </motion.div>
            )}
            
            {!uploading && progress === 100 && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="mt-4 flex items-center gap-2 text-green-500"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Berhasil Diunggah</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-brand-red bg-red-50 p-4 rounded-xl border border-red-100">
          <AlertCircle className="w-4 h-4" />
          <p className="text-[10px] font-black uppercase tracking-widest leading-none">{error}</p>
        </div>
      )}
    </div>
  );
};

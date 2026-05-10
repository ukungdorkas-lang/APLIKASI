import React, { useState, useRef } from 'react';
import { Upload, X, File, Image as ImageIcon, Video, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FileUploadProps {
  onUploadSuccess: (url: string) => void;
  allowedTypes?: string[];
  maxSize?: number; // in MB
  label?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onUploadSuccess, 
  allowedTypes = ['image/*', 'application/pdf', 'video/*'],
  maxSize = 10,
  label = "Unggah Dokumen / Media"
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const startSimulatedUpload = (file: File) => {
    setUploading(true);
    setProgress(0);
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      if (currentProgress >= 100) {
        clearInterval(interval);
        setProgress(100);
        setUploading(false);
        
        // Use URL.createObjectURL as a stable fake URL if preview isn't ready
        const url = file.type.startsWith('image/') 
          ? URL.createObjectURL(file) 
          : 'https://example.com/uploaded-file';
        
        onUploadSuccess(url);
      } else {
        setProgress(currentProgress);
      }
    }, 100);
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
      
      {!file ? (
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
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border-2 border-slate-100">
              {preview ? (
                <img src={preview} className="w-full h-full object-cover" />
              ) : file.type.startsWith('video/') ? (
                <Video className="w-8 h-8 text-slate-400" />
              ) : (
                <File className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black italic uppercase tracking-tighter truncate leading-none mb-1">{file.name}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1].toUpperCase()}</p>
            </div>
            {!uploading && (
              <button 
                onClick={removeFile}
                className="p-3 bg-red-50 text-brand-red rounded-xl hover:bg-brand-red hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
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

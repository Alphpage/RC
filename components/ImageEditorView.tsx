
import React, { useState, useRef } from 'react';
import { Camera, Send, Loader2, Sparkles, RefreshCcw } from 'lucide-react';
import { editImageWithPrompt } from '../services/geminiService';

const ImageEditorView: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!image || !prompt) return;
    setLoading(true);
    const editedUrl = await editImageWithPrompt(image, prompt);
    if (editedUrl) {
      setResult(editedUrl);
    }
    setLoading(false);
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setPrompt('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-purple-500" /> ИИ Редактор Фото Отчетов
        </h2>
        
        {!image ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-2xl h-64 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <Camera size={48} className="text-slate-300" />
            <p className="text-slate-400 text-sm">Нажмите, чтобы загрузить фото точки</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video">
              <img 
                src={result || image} 
                className={`w-full h-full object-contain ${loading ? 'opacity-50' : 'opacity-100'}`} 
                alt="Working image"
              />
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-2">
                  <Loader2 className="animate-spin" size={32} />
                  <p className="text-xs font-bold bg-black/40 px-3 py-1 rounded-full">Магия ИИ...</p>
                </div>
              )}
              <button 
                onClick={reset}
                className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full backdrop-blur-md"
              >
                <RefreshCcw size={16} />
              </button>
            </div>

            <div className="flex gap-2">
              <input 
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Что изменить? (напр. 'Сделай ярче')"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <button 
                onClick={handleEdit}
                disabled={loading || !prompt}
                className="bg-purple-600 text-white p-3 rounded-lg shadow-lg shadow-purple-200 disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            </div>
            
            <p className="text-[10px] text-slate-400 italic">
              Используйте промпты: "Удали лишние предметы", "Добавь ретро фильтр", "Сделай фото светлее".
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageEditorView;

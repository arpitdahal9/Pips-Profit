import React from 'react';
import { Bold, Italic, Underline, List, Link as LinkIcon, Image } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, className = "" }) => {
  return (
    <div className={`flex flex-col border border-slate-700 rounded-xl overflow-hidden bg-slate-800 shadow-lg ${className}`}>
      <div className="flex items-center gap-1 p-2 border-b border-slate-700 bg-slate-900">
        <div className="flex items-center gap-1 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 mr-2">
            <span className="text-xs font-medium text-slate-300">Normal</span>
        </div>
        
        <button className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"><Bold size={16} /></button>
        <button className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"><Italic size={16} /></button>
        <button className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"><Underline size={16} /></button>
        <div className="w-px h-4 bg-slate-700 mx-1"></div>
        <button className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"><List size={16} /></button>
        <button className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"><LinkIcon size={16} /></button>
        <button className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"><Image size={16} /></button>
      </div>
      <textarea
        className="flex-1 p-4 resize-none focus:outline-none bg-slate-800 text-slate-200 leading-relaxed text-sm min-h-[200px] placeholder:text-slate-500"
        value={value.replace(/<[^>]*>/g, '')} // Strip HTML for this simple textarea demo
        onChange={(e) => onChange(e.target.value)}
        placeholder="Record your psychological state, execution quality, and market observations..."
      />
    </div>
  );
};

export default RichTextEditor;
import React from 'react';
import { Plus, FileText, Layers, X } from 'lucide-react';

interface TradeTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSingle: () => void;
  onSelectMultiple: () => void;
  buttonPosition?: { top: number; right: number };
  theme: any;
}

const TradeTypeSelector: React.FC<TradeTypeSelectorProps> = ({
  isOpen,
  onClose,
  onSelectSingle,
  onSelectMultiple,
  buttonPosition,
  theme
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      {!buttonPosition && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={onClose}
        />
      )}

      {/* Popup */}
      <div
        className={buttonPosition ? 'absolute' : 'fixed'}
        style={buttonPosition 
          ? { bottom: '100%', right: '0', marginBottom: '8px', zIndex: 50 }
          : { bottom: '120px', right: '16px', zIndex: 50 }
        }
      >
        <div 
          className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden min-w-[220px]"
          style={{ borderColor: theme.primary + '30' }}
        >
        <div className="p-2">
          <button
            onClick={onSelectSingle}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors text-left group"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: theme.primary + '20' }}
            >
              <FileText size={20} style={{ color: theme.primary }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Add a single trade log</p>
              <p className="text-xs text-slate-400">One trade entry</p>
            </div>
          </button>

          <button
            onClick={onSelectMultiple}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors text-left group mt-1"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: theme.primary + '20' }}
            >
              <Layers size={20} style={{ color: theme.primary }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Add Multiple Trade log</p>
              <p className="text-xs text-slate-400">Multiple entries at once</p>
            </div>
          </button>
        </div>
        </div>
      </div>
    </>
  );
};

export default TradeTypeSelector;


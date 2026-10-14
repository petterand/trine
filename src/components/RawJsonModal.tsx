import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Code2, X, Copy, Check, Download, AlertCircle } from 'lucide-react';

export const RawJsonModal: React.FC = () => {
  const {
    isRawJsonModalOpen,
    setIsRawJsonModalOpen,
    appData,
    importRawJsonString,
    filePath,
    exportDataFile
  } = useApp();

  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isRawJsonModalOpen) {
      setJsonText(JSON.stringify(appData, null, 2));
      setError(null);
      setIsSuccess(false);
    }
  }, [isRawJsonModalOpen, appData]);

  if (!isRawJsonModalOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveJson = () => {
    try {
      const ok = importRawJsonString(jsonText);
      if (ok) {
        setIsSuccess(true);
        setError(null);
        setTimeout(() => setIsSuccess(false), 2000);
      } else {
        setError('Invalid schema format. Please ensure "todos" array exists.');
      }
    } catch (err: any) {
      setError(err.message || 'JSON Parse Error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="chronos-glass-modal w-full max-w-3xl max-h-[90vh] flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 font-heading">
              Local JSON File Inspector & Editor
            </h2>
            <span className="text-[11px] text-slate-600 font-mono px-2 py-0.5 rounded bg-slate-200/60 border border-slate-200">
              {filePath}
            </span>
          </div>
          <button
            onClick={() => setIsRawJsonModalOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Editor Area */}
        <div className="flex-1 p-6 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-2 text-xs text-slate-500">
            <span>Direct JSON representation saved locally on disk:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors font-medium"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied' : 'Copy JSON'}</span>
              </button>
              <button
                onClick={() => exportDataFile()}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors font-medium"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Download .json</span>
              </button>
            </div>
          </div>

          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setError(null);
            }}
            spellCheck={false}
            className="w-full flex-1 min-h-[360px] bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 custom-scrollbar leading-relaxed"
          />

          {error && (
            <div className="mt-2 p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess && (
            <div className="mt-2 p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Changes validated and saved to local JSON storage!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-between bg-slate-50 text-xs">
          <span className="text-slate-500">
            Edit JSON directly to batch modify tasks or settings, then click Apply.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRawJsonModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium"
            >
              Close
            </button>
            <button
              onClick={handleSaveJson}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-sm"
            >
              Apply JSON Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

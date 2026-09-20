import React, { useState } from 'react';
import { Download, Upload, Copy, Check, X, ShieldAlert, Smartphone } from 'lucide-react';
import { exportBackup, parseBackupText } from '../utils/storage';

export default function BackupModal({ isOpen, onClose, state, onRestoreState }) {
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  if (!isOpen) return null;

  const handleDownloadFile = () => {
    exportBackup(state);
  };

  const handleCopyCode = () => {
    const jsonStr = JSON.stringify(state);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportText = () => {
    setImportError('');
    setImportSuccess('');
    try {
      const restored = parseBackupText(importText);
      onRestoreState(restored);
      setImportSuccess('Data successfully restored!');
      setImportText('');
      setTimeout(() => {
        setImportSuccess('');
        onClose();
      }, 1500);
    } catch (err) {
      setImportError(err.message || 'Invalid backup data.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const restored = parseBackupText(event.target.result);
        onRestoreState(restored);
        setImportSuccess('Backup file loaded successfully!');
        setTimeout(() => {
          setImportSuccess('');
          onClose();
        }, 1500);
      } catch (err) {
        setImportError('Failed to parse backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          class="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X class="w-5 h-5" />
        </button>

        <div>
          <h2 class="text-lg font-black text-white flex items-center gap-2">
            <Download class="w-5 h-5 text-emerald-400" />
            Backup & Data Safeguards
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Your data auto-saves in browser storage. Use backups to transfer or protect your season history.
          </p>
        </div>

        {/* PWA Tip Banner */}
        <div class="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl flex items-start gap-2.5">
          <Smartphone class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div class="text-xs text-slate-300">
            <span class="font-bold text-emerald-400 block">Pro Tip for iPhone & Android:</span>
            Tap <strong class="text-white">"Add to Home Screen"</strong> in your phone browser menu to install this app. Its data will stay isolated and protected from history clearing!
          </div>
        </div>

        {/* Export Options */}
        <div class="space-y-2">
          <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">Export / Save Backup</h3>
          <div class="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadFile}
              class="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Download class="w-4 h-4" />
              <span>Download File</span>
            </button>
            <button
              onClick={handleCopyCode}
              class="py-2.5 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition border border-slate-600"
            >
              {copied ? <Check class="w-4 h-4 text-emerald-400" /> : <Copy class="w-4 h-4" />}
              <span>{copied ? 'Copied Code!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div class="space-y-2 pt-2 border-t border-slate-700">
          <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">Import / Restore Backup</h3>

          {/* File Upload Input */}
          <label class="block w-full cursor-pointer py-2 px-3 bg-slate-900 border border-dashed border-slate-600 hover:border-emerald-500 rounded-xl text-center text-xs text-slate-300 transition">
            <Upload class="w-4 h-4 inline mr-1 text-emerald-400" />
            <span>Select Backup .json File</span>
            <input type="file" accept=".json" onChange={handleFileUpload} class="hidden" />
          </label>

          <div class="text-center text-[10px] text-slate-500">OR PASTE BACKUP CODE BELOW</div>

          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste exported backup JSON text code here..."
            class="w-full h-20 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />

          {importError && (
            <div class="p-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg flex items-center gap-1.5">
              <ShieldAlert class="w-4 h-4 flex-shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {importSuccess && (
            <div class="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg font-bold text-center">
              {importSuccess}
            </div>
          )}

          <button
            onClick={handleImportText}
            disabled={!importText.trim()}
            class="w-full py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 font-bold rounded-xl text-xs transition"
          >
            Restore from Text Code
          </button>
        </div>
      </div>
    </div>
  );
}

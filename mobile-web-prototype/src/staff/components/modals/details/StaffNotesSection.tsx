import React from 'react';

export interface StaffNotesSectionProps {
  notesText: string;
  isNoteSaved: boolean;
  onNotesChange: (text: string) => void;
  onSaveNote: () => void;
  onClearNote: () => void;
}

export const StaffNotesSection: React.FC<StaffNotesSectionProps> = React.memo(({
  notesText,
  isNoteSaved,
  onNotesChange,
  onSaveNote,
  onClearNote,
}) => {
  return (
    <div className="inner-detail-card p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">STAFF NOTES</h4>
        </div>
        <span id="order-notes-status" className="text-[10px] font-mono text-slate-400">
          {isNoteSaved ? 'Note saved' : 'No notes added'}
        </span>
      </div>

      <div className="space-y-2.5">
        <textarea
          id="order-notes-textarea"
          rows={3}
          value={notesText}
          onChange={(e) => onNotesChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              onSaveNote();
            }
          }}
          placeholder="Add operational notes (e.g., customer called for hold, fragile packaging, authorized rep pickup)..."
          className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#215cd4] focus:border-[#215cd4] resize-none font-sans leading-relaxed"
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-slate-500">Visible to counter staff only (Ctrl+Enter to save)</span>
          <div className="flex items-center gap-2">
            {notesText ? (
              <button
                type="button"
                id="clear-order-notes-btn"
                onClick={onClearNote}
                className="btn-press px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              >
                Clear
              </button>
            ) : null}
            <button
              type="button"
              id="save-order-notes-btn"
              onClick={onSaveNote}
              className="btn-press px-3.5 py-1.5 rounded-xl bg-[#215cd4] hover:bg-[#194cb5] text-white text-xs font-bold transition-all shadow-md shadow-blue-900/30 flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>Save Note</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

StaffNotesSection.displayName = 'StaffNotesSection';


import React from 'react';
import { MethodBadge } from './MethodBadge';
import type { PostmanEndpointSpec } from '../types';

export interface RequestBarProps {
  readonly spec: PostmanEndpointSpec;
  readonly resolvedUrl: string;
  readonly isSending: boolean;
  readonly onSend: () => void;
  readonly onCopyCurl: () => void;
}

export const RequestBar: React.FC<RequestBarProps> = ({
  spec,
  resolvedUrl,
  isSending,
  onSend,
  onCopyCurl,
}) => {
  return (
    <div className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3 space-y-2">
      {/* Title + Contract Type */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-zinc-900 truncate">{spec.title}</h2>
          <p className="text-xs text-zinc-500 truncate">{spec.description}</p>
        </div>
        <span className="font-mono text-[10px] text-zinc-500 bg-zinc-50 border border-zinc-200 rounded px-2 py-0.5 shrink-0">
          {spec.contractSummary.reqType} -&gt; {spec.contractSummary.resType}
        </span>
      </div>

      {/* Unified Flat URL Bar */}
      <div className="flex items-stretch gap-2">
        <div className="flex-1 min-w-0 flex items-center border border-zinc-300 rounded bg-zinc-50 focus-within:border-zinc-900 focus-within:bg-white">
          <div className="px-2.5 py-1.5 border-r border-zinc-200 shrink-0">
            <MethodBadge method={spec.method} />
          </div>
          <input
            type="text"
            readOnly
            aria-label="Resolved Request URL"
            value={resolvedUrl}
            className="flex-1 min-w-0 bg-transparent px-2.5 py-1.5 font-mono text-xs text-zinc-900 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={onCopyCurl}
          className="px-3 py-1.5 text-xs font-mono font-medium rounded border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:text-zinc-900 cursor-pointer shrink-0 transition-colors"
        >
          cURL
        </button>

        <button
          type="button"
          onClick={onSend}
          disabled={isSending}
          aria-label="Send Request"
          className="px-4 py-1.5 text-xs font-semibold rounded bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-50 cursor-pointer shrink-0 transition-colors"
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>

      {/* Guard Hint */}
      {spec.guardHint && (
        <div className="text-[11px] text-zinc-500 bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1 font-mono truncate">
          {spec.guardHint}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { SEEDED_CUSTOMER_ACCOUNTS, SEEDED_STAFF_ACCOUNT } from '../endpoints';
import type { CustomerProfile, PostmanTokenVault } from '../types';

export interface AuthSessionPanelProps {
  readonly tokens: PostmanTokenVault;
  readonly customerProfile: CustomerProfile | null;
  readonly staffUsername: string;
  readonly selectedSeedIdx: number;
  readonly onSelectSeedAccount: (idx: number) => void;
  readonly onQuickCustomerLogin: () => Promise<void>;
  readonly onQuickStaffLogin: () => Promise<void>;
  readonly onClearCustomer: () => void;
  readonly onClearStaff: () => void;
  readonly onCopyText: (text: string, label: string) => void;
  readonly isCustomerLoggingIn: boolean;
  readonly isStaffLoggingIn: boolean;
}

function maskToken(token: string, reveal: boolean): string {
  if (!token) return 'empty';
  if (reveal || token.length <= 26) return token;
  return `${token.slice(0, 14)}...${token.slice(-6)}`;
}

export const AuthSessionPanel: React.FC<AuthSessionPanelProps> = ({
  tokens,
  customerProfile,
  staffUsername,
  selectedSeedIdx,
  onSelectSeedAccount,
  onQuickCustomerLogin,
  onQuickStaffLogin,
  onClearCustomer,
  onClearStaff,
  onCopyText,
  isCustomerLoggingIn,
  isStaffLoggingIn,
}) => {
  const [revealTokens, setRevealTokens] = useState(false);
  const activeSeed = SEEDED_CUSTOMER_ACCOUNTS[selectedSeedIdx] || SEEDED_CUSTOMER_ACCOUNTS[0];

  return (
    <div className="p-3 space-y-4 overflow-y-auto flex-1 min-h-0">
      {/* Customer Session Block */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Customer Session
          </span>
          <span
            className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
              tokens.customerAuthToken
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : tokens.customerPreAuthToken
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-400'
            }`}
          >
            {tokens.customerAuthToken
              ? 'Bearer Active'
              : tokens.customerPreAuthToken
                ? 'Pre-Auth'
                : 'Signed Out'}
          </span>
        </div>

        {/* Seed Switcher */}
        <div className="flex items-center justify-between gap-1.5 p-2 rounded border border-zinc-200 bg-zinc-50">
          <div className="min-w-0 font-mono text-[10px] text-zinc-700 truncate">
            {activeSeed.email} · MPIN {activeSeed.mpin}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {SEEDED_CUSTOMER_ACCOUNTS.map((acc, idx) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => onSelectSeedAccount(idx)}
                className={`px-1.5 py-0.5 text-[10px] rounded border cursor-pointer ${
                  selectedSeedIdx === idx
                    ? 'border-zinc-900 bg-zinc-900 text-white'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400'
                }`}
              >
                {acc.firstName}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={isCustomerLoggingIn}
            onClick={onQuickCustomerLogin}
            className="flex-1 py-1.5 px-2.5 text-[11px] font-medium rounded bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-50 cursor-pointer transition-colors"
          >
            {isCustomerLoggingIn ? 'Signing in...' : '1-Click Customer Login'}
          </button>
          {(tokens.customerAuthToken || tokens.customerPreAuthToken) && (
            <button
              type="button"
              onClick={onClearCustomer}
              className="py-1.5 px-2 text-[11px] rounded border border-zinc-200 text-zinc-600 hover:border-rose-300 hover:text-rose-700 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Customer Token Rows */}
        <div className="border border-zinc-200 rounded bg-zinc-50 divide-y divide-zinc-200 text-[10px] font-mono">
          <div className="px-2 py-1.5 flex items-center justify-between text-zinc-500">
            <span className="truncate">
              {customerProfile
                ? `${customerProfile.firstName} ${customerProfile.lastName}`
                : 'No profile loaded'}
            </span>
            <button
              type="button"
              onClick={() => setRevealTokens((v) => !v)}
              className="text-zinc-700 hover:text-zinc-900 underline cursor-pointer shrink-0 ml-2"
            >
              {revealTokens ? 'Mask' : 'Reveal'}
            </button>
          </div>
          {(
            [
              { label: 'auth', value: tokens.customerAuthToken },
              { label: 'preAuth', value: tokens.customerPreAuthToken },
              { label: 'refresh', value: tokens.customerRefreshToken },
              { label: 'reset', value: tokens.customerResetToken },
            ] as const
          ).map((row) => (
            <div key={row.label} className="px-2 py-1 flex items-center justify-between gap-2">
              <div className="min-w-0 truncate text-zinc-600">
                <span className="text-zinc-400">{row.label}:</span>{' '}
                <span className={row.value ? 'text-zinc-900 break-all' : 'text-zinc-400'}>
                  {maskToken(row.value, revealTokens)}
                </span>
              </div>
              {row.value && (
                <button
                  type="button"
                  onClick={() => onCopyText(row.value, `customer ${row.label} token`)}
                  className="text-[9px] text-zinc-500 hover:text-zinc-900 cursor-pointer shrink-0"
                >
                  Copy
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Staff Session Block */}
      <div className="space-y-2 pt-3 border-t border-zinc-200">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Staff Session
          </span>
          <span
            className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
              tokens.staffAuthToken
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-zinc-200 bg-zinc-50 text-zinc-400'
            }`}
          >
            {tokens.staffAuthToken ? staffUsername : 'Signed Out'}
          </span>
        </div>

        <div className="px-2 py-1.5 rounded border border-zinc-200 bg-zinc-50 font-mono text-[10px] text-zinc-600">
          Seed: {SEEDED_STAFF_ACCOUNT.username} / {SEEDED_STAFF_ACCOUNT.password}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={isStaffLoggingIn}
            onClick={onQuickStaffLogin}
            className="flex-1 py-1.5 px-2.5 text-[11px] font-medium rounded border border-zinc-900 bg-white hover:bg-zinc-900 text-zinc-900 hover:text-white disabled:opacity-50 cursor-pointer transition-colors"
          >
            {isStaffLoggingIn ? 'Signing in...' : '1-Click Staff Login'}
          </button>
          {tokens.staffAuthToken && (
            <button
              type="button"
              onClick={onClearStaff}
              className="py-1.5 px-2 text-[11px] rounded border border-zinc-200 text-zinc-600 hover:border-rose-300 hover:text-rose-700 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="border border-zinc-200 rounded bg-zinc-50 divide-y divide-zinc-200 text-[10px] font-mono">
          {(
            [
              { label: 'auth', value: tokens.staffAuthToken },
              { label: 'refresh', value: tokens.staffRefreshToken },
            ] as const
          ).map((row) => (
            <div key={row.label} className="px-2 py-1 flex items-center justify-between gap-2">
              <div className="min-w-0 truncate text-zinc-600">
                <span className="text-zinc-400">{row.label}:</span>{' '}
                <span className={row.value ? 'text-zinc-900 break-all' : 'text-zinc-400'}>
                  {maskToken(row.value, revealTokens)}
                </span>
              </div>
              {row.value && (
                <button
                  type="button"
                  onClick={() => onCopyText(row.value, `staff ${row.label} token`)}
                  className="text-[9px] text-zinc-500 hover:text-zinc-900 cursor-pointer shrink-0"
                >
                  Copy
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Realtime Token Block (only when captured) */}
      {tokens.realtimeToken && (
        <div className="space-y-1.5 pt-3 border-t border-zinc-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Realtime Channel
            </span>
            <button
              type="button"
              onClick={() => onCopyText(tokens.realtimeToken, 'realtime token')}
              className="text-[10px] font-mono text-zinc-600 hover:text-zinc-900 cursor-pointer"
            >
              Copy JWT
            </button>
          </div>
          <div className="p-2 rounded border border-zinc-200 bg-zinc-50 font-mono text-[10px] text-zinc-700 break-all">
            <div>channel: {tokens.realtimeChannel}</div>
            <div className="text-zinc-400 mt-0.5">
              jwt: {maskToken(tokens.realtimeToken, revealTokens)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

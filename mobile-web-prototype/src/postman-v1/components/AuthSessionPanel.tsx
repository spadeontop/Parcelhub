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
  readonly onConnectVaultRealtime: () => void;
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
  onConnectVaultRealtime,
}) => {
  const [revealTokens, setRevealTokens] = useState(false);
  const activeSeed = SEEDED_CUSTOMER_ACCOUNTS[selectedSeedIdx] || SEEDED_CUSTOMER_ACCOUNTS[0];

  return (
    <div className="p-3 space-y-4 overflow-y-auto flex-1 min-h-0">
      {/* Customer Session Block */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Customer Session
          </span>
          <span
            className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
              tokens.customerAuthToken
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/60 dark:text-emerald-400'
                : tokens.customerPreAuthToken
                  ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/70 dark:bg-blue-950/60 dark:text-blue-400'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500'
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
        <div className="flex items-center justify-between gap-1.5 p-2 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <div className="min-w-0 font-mono text-[10px] text-zinc-700 dark:text-zinc-300 truncate">
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
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500'
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
            className="flex-1 py-1.5 px-2.5 text-[11px] font-medium rounded bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {isCustomerLoggingIn ? 'Signing in...' : '1-Click Customer Login'}
          </button>
          {(tokens.customerAuthToken || tokens.customerPreAuthToken) && (
            <button
              type="button"
              onClick={onClearCustomer}
              className="py-1.5 px-2 text-[11px] rounded border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-rose-300 dark:hover:border-rose-700 hover:text-rose-700 dark:hover:text-rose-400 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Customer Token Rows */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800 text-[10px] font-mono">
          <div className="px-2 py-1.5 flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="truncate">
              {customerProfile
                ? `${customerProfile.firstName} ${customerProfile.lastName}`
                : 'No profile loaded'}
            </span>
            <button
              type="button"
              onClick={() => setRevealTokens((v) => !v)}
              className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 underline cursor-pointer shrink-0 ml-2"
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
              <div className="min-w-0 truncate text-zinc-600 dark:text-zinc-400">
                <span className="text-zinc-400 dark:text-zinc-500">{row.label}:</span>{' '}
                <span className={row.value ? 'text-zinc-900 dark:text-zinc-100 break-all' : 'text-zinc-400 dark:text-zinc-500'}>
                  {maskToken(row.value, revealTokens)}
                </span>
              </div>
              {row.value && (
                <button
                  type="button"
                  onClick={() => onCopyText(row.value, `customer ${row.label} token`)}
                  className="text-[9px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer shrink-0"
                >
                  Copy
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Staff Session Block */}
      <div className="space-y-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Staff Session
          </span>
          <span
            className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
              tokens.staffAuthToken
                ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/70 dark:bg-blue-950/60 dark:text-blue-400'
                : 'border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500'
            }`}
          >
            {tokens.staffAuthToken ? staffUsername : 'Signed Out'}
          </span>
        </div>

        <div className="px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-mono text-[10px] text-zinc-600 dark:text-zinc-400">
          Seed: {SEEDED_STAFF_ACCOUNT.username} / {SEEDED_STAFF_ACCOUNT.password}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={isStaffLoggingIn}
            onClick={onQuickStaffLogin}
            className="flex-1 py-1.5 px-2.5 text-[11px] font-medium rounded border border-zinc-900 dark:border-zinc-200 bg-white dark:bg-zinc-950 hover:bg-zinc-900 dark:hover:bg-zinc-100 text-zinc-900 dark:text-zinc-100 hover:text-white dark:hover:text-zinc-950 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {isStaffLoggingIn ? 'Signing in...' : '1-Click Staff Login'}
          </button>
          {tokens.staffAuthToken && (
            <button
              type="button"
              onClick={onClearStaff}
              className="py-1.5 px-2 text-[11px] rounded border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-rose-300 dark:hover:border-rose-700 hover:text-rose-700 dark:hover:text-rose-400 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800 text-[10px] font-mono">
          {(
            [
              { label: 'auth', value: tokens.staffAuthToken },
              { label: 'refresh', value: tokens.staffRefreshToken },
            ] as const
          ).map((row) => (
            <div key={row.label} className="px-2 py-1 flex items-center justify-between gap-2">
              <div className="min-w-0 truncate text-zinc-600 dark:text-zinc-400">
                <span className="text-zinc-400 dark:text-zinc-500">{row.label}:</span>{' '}
                <span className={row.value ? 'text-zinc-900 dark:text-zinc-100 break-all' : 'text-zinc-400 dark:text-zinc-500'}>
                  {maskToken(row.value, revealTokens)}
                </span>
              </div>
              {row.value && (
                <button
                  type="button"
                  onClick={() => onCopyText(row.value, `staff ${row.label} token`)}
                  className="text-[9px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer shrink-0"
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
        <div className="space-y-1.5 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Realtime Channel
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onConnectVaultRealtime}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-white cursor-pointer"
              >
                Connect WS
              </button>
              <button
                type="button"
                onClick={() => onCopyText(tokens.realtimeToken, 'realtime token')}
                className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
              >
                Copy JWT
              </button>
            </div>
          </div>
          <div className="p-2 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-mono text-[10px] text-zinc-700 dark:text-zinc-300 break-all">
            <div>channel: {tokens.realtimeChannel}</div>
            <div className="text-zinc-400 dark:text-zinc-500 mt-0.5">
              jwt: {maskToken(tokens.realtimeToken, revealTokens)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import { CustomerCancelReasonCode } from '../types/api';

const REASON_CODE_MAP: Record<string, CustomerCancelReasonCode> = {
  'Changed my mind': 'CHANGED_MIND',
  'Ordered wrong item or details': 'WRONG_DETAILS',
  'Ordered wrong item or variant': 'WRONG_DETAILS',
  'Hub waiting time is too long': 'DELIVERY_DELAYED',
  'Will pay / reorder later': 'OTHER',
  'Hub location too far': 'OTHER',
  'Found a better alternative': 'OTHER',
};

/**
 * Maps a UI cancellation reason label + optional notes into the v1 API
 * `reasonCode` and `reason` payload fields.
 */
export function buildCancelReasonPayload(
  selectedReason: string | null,
  notes: string
): { readonly reasonCode: CustomerCancelReasonCode; readonly reason?: string } {
  const baseLabel = (selectedReason || '').trim();
  const reasonCode: CustomerCancelReasonCode = REASON_CODE_MAP[baseLabel] ?? 'OTHER';
  const trimmedNotes = notes.trim();

  if (baseLabel && trimmedNotes) {
    return { reasonCode, reason: `${baseLabel} — ${trimmedNotes}` };
  }
  if (trimmedNotes) {
    return { reasonCode, reason: trimmedNotes };
  }
  if (baseLabel) {
    return { reasonCode, reason: baseLabel };
  }
  return { reasonCode };
}

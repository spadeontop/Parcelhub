import { Order } from '../types/domain';
export declare const parseCurrency: (str?: string | null) => number;
export declare const getStatedFee: (order: Order) => number;
export declare const isClaimUnlocked: (order: Order, cutoffMins?: number) => boolean;
export declare const getClaimTimeRemainingSeconds: (order: Order, cutoffMins?: number) => number;
export declare const calculateChange: (amountReceived: number | string, codAmount: number | string) => number;
//# sourceMappingURL=calculations.d.ts.map
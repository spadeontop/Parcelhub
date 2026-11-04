export const parseCurrency = (str) => {
    if (!str)
        return 0;
    const num = parseInt(str.replace(/[^\d]/g, ''), 10);
    return isNaN(num) ? 0 : num;
};
export const getStatedFee = (order) => {
    if (order.statedFee !== undefined && order.statedFee > 0) {
        return order.statedFee;
    }
    const paid = parseCurrency(order.paidAmount);
    if (paid > 0)
        return paid;
    const cod = parseCurrency(order.codAmount);
    return cod > 0 ? cod : 480;
};
export const isClaimUnlocked = (order, cutoffMins = 5) => {
    if (order.status !== 'READY_TO_CLAIM' || !order.claimInitiatedAt)
        return false;
    const cutoffMs = cutoffMins * 60 * 1000;
    const elapsed = Date.now() - order.claimInitiatedAt;
    return elapsed >= 0 && elapsed <= cutoffMs;
};
export const getClaimTimeRemainingSeconds = (order, cutoffMins = 5) => {
    if (order.status !== 'READY_TO_CLAIM' || !order.claimInitiatedAt)
        return 0;
    const cutoffMs = cutoffMins * 60 * 1000;
    const elapsed = Date.now() - order.claimInitiatedAt;
    if (elapsed < 0)
        return cutoffMins * 60;
    const remaining = Math.max(0, Math.floor((cutoffMs - elapsed) / 1000));
    return Math.min(cutoffMins * 60, remaining);
};
export const calculateChange = (amountReceived, codAmount) => {
    const received = typeof amountReceived === 'string' ? parseCurrency(amountReceived) : amountReceived;
    const cod = typeof codAmount === 'string' ? parseCurrency(codAmount) : codAmount;
    return Math.max(0, received - cod);
};

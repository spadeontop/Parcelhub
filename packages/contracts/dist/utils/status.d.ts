import { OrderStatus, StaffFilter } from '../types/domain';
export declare function getStatusLabel(status: OrderStatus): string;
export declare function getStatusTextColor(status: OrderStatus): string;
export declare function getStatusBgColor(status: OrderStatus): string;
export declare function getStatusBorderColor(status: OrderStatus): string;
export declare function mapStaffFilterToStatus(filter: StaffFilter): OrderStatus | null;
export declare function mapStatusToStaffFilter(status: OrderStatus): StaffFilter;
//# sourceMappingURL=status.d.ts.map
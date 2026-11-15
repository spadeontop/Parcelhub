/**
 * ParcelHub Customer Mobile v1 TypeScript Contracts
 * Strictly aligned with backend/app/types/v1/api.ts
 */

export type ISO8601Timestamp = string;
export type CustomerId = `CST-${string}`;
export type JWTToken = string;
export type MPIN = `${number}${number}${number}${number}`;

export type StandardSuccessResponse<TMessage extends string = string> = {
  readonly statusMessage: TMessage;
};

export type ApiErrorResponse = {
  readonly success: false;
  readonly error: string;
  readonly message: string;
  readonly statusCode: number;
};

// Customer Profile Contract
export type CustomerProfile = {
  readonly id: CustomerId;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly middleInitial?: string;
  readonly phoneNumber: string;
  readonly blacklisted?: boolean;
  readonly blacklistReason?: string | null;
  readonly createdAt?: ISO8601Timestamp;
  readonly updatedAt?: ISO8601Timestamp;
};

// POST /api/v1/customer/login
export type CustomerLoginReq = {
  readonly email: string;
  readonly password: string;
};

export type CustomerLoginRes = StandardSuccessResponse & {
  readonly preAuthToken: JWTToken;
};

// POST /api/v1/customer/register
export type CustomerRegisterReq = {
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly middleInitial?: string;
  readonly phoneNumber: string;
};

export type CustomerRegisterRes = StandardSuccessResponse & {
  readonly preAuthToken: JWTToken;
};

// POST /api/v1/customer/create-mpin
export type CustomerCreateMpinReq = {
  readonly preAuthToken: JWTToken;
  readonly mpin: MPIN;
};

export type CustomerCreateMpinRes = StandardSuccessResponse & {
  readonly authToken: JWTToken;
  readonly refreshToken: JWTToken;
  readonly customer?: CustomerProfile;
};

// POST /api/v1/customer/mpin
export type CustomerVerifyMpinReq = {
  readonly preAuthToken: JWTToken;
  readonly mpin: MPIN;
};

export type CustomerVerifyMpinRes = StandardSuccessResponse & {
  readonly authToken: JWTToken;
  readonly refreshToken: JWTToken;
  readonly customer?: CustomerProfile;
};

/**
 * Standard typed API error carrying status code, error classification,
 * and a flag indicating if the error was due to an unreachable API.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly error: string;
  readonly isNetworkError: boolean;

  constructor(
    message: string,
    statusCode: number,
    error: string = 'Bad Request',
    isNetworkError: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.error = error;
    this.isNetworkError = isNetworkError;
  }
}

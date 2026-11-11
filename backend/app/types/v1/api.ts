/**
 * ParcelHub API v1 TypeScript Contracts & Types
 */

export * from "@/app/types/api";

// Customer v1 contract definitions (if extended or specific to v1)
export type CustomerLoginV1Req = {
  readonly email: string;
  readonly password: string;
};

export type CustomerLoginV1Res = {
  readonly statusMessage: string;
  readonly preAuthToken: string;
};


export interface CustomerRegisterRequest {
    password: string;
    email: string;
    firstname: string;
    lastname: string;
    middleinitial?: string;
    phonenumber: string;
}
export interface CustomerRegisterResponse {
    statusMessage: string;
    refreshToken: string;
}
export interface CustomerLoginRequest {
    email: string;
    password: string;
}
export interface CustomerLoginResponse {
    statusMessage: string;
    refreshToken: string;
}
export interface CustomerCreateMpinRequest {
    refreshToken: string;
    mpin: string;
}
export interface CustomerCreateMpinResponse {
    statusMessage: string;
    authToken: string;
}
export interface CustomerVerifyMpinRequest {
    refreshToken: string;
    mpin: string;
}
export interface CustomerVerifyMpinResponse {
    statusMessage: string;
    authToken: string;
}
export interface StaffLoginRequest {
    email: string;
    password: string;
}
export interface StaffLoginResponse {
    statusMessage: string;
    refreshToken: string;
}
export interface AuthCustomer {
    email: string;
    firstname: string;
    lastname: string;
    middleinitial?: string;
    phonenumber: string;
}
export interface AuthStaff {
    id: string;
    email: string;
    name: string;
    hubId: string;
}
//# sourceMappingURL=auth.d.ts.map
export interface RetainedRegistrationData {
  currentStep: 1 | 2;
  firstName: string;
  lastName: string;
  middleInitial: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  emailError?: string;
}

const defaultRegistrationData: RetainedRegistrationData = {
  currentStep: 1,
  firstName: '',
  lastName: '',
  middleInitial: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  emailError: '',
};

export let retainedRegistrationData: RetainedRegistrationData = {
  ...defaultRegistrationData,
};

export const getRetainedRegistrationData = (): RetainedRegistrationData => {
  return retainedRegistrationData;
};

export const setRetainedRegistrationData = (data: Partial<RetainedRegistrationData>): void => {
  retainedRegistrationData = {
    ...retainedRegistrationData,
    ...data,
  };
};

export const clearRetainedRegistrationData = (): void => {
  retainedRegistrationData = {
    ...defaultRegistrationData,
  };
};

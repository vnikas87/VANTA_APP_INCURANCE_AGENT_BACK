export type LookupRouteKey =
  | 'partners'
  | 'companies'
  | 'branches'
  | 'contract-types'
  | 'document-types'
  | 'production-types'
  | 'payment-frequencies';

export type LookupItemBody = {
  code?: string;
  name?: string;
  greekLabel?: string;
  isActive?: boolean;
  companyId?: number | null;
  value?: number;
};

export type CustomerBody = {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  mobilePhone?: string;
  email?: string;
  taxNumber?: string;
  notes?: string;
};

export type PolicyBody = {
  policyNumber?: string;
  identifier?: string;
  customerId?: number;
  partnerId?: number | null;
  companyId?: number | null;
  branchId?: number | null;
  contractTypeId?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
};

export type TransactionBody = {
  applicationDate?: string | null;
  issueDate?: string | null;
  deliveryDate?: string | null;
  documentTypeId?: number | null;
  productionTypeId?: number | null;
  paymentFrequencyId?: number | null;
  insuranceYear?: number | null;
  installmentNumber?: number | null;
  remarks?: string | null;
};

export type FinancialBody = {
  annualNetAmount?: number | string | null;
  annualGrossAmount?: number | string | null;
  installmentNetAmount?: number | string | null;
  installmentGrossAmount?: number | string | null;
  contractRate?: number | string | null;
  contractCommission?: number | string | null;
  incomingCommission?: number | string | null;
  performanceRate?: number | string | null;
  performanceAmount?: number | string | null;
  differenceAmount?: number | string | null;
};

export type CreateProductionRecordBody = {
  policyId?: number;
  policy?: PolicyBody;
  transaction?: TransactionBody;
  financial?: FinancialBody;
};

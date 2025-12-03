import apiClient from './apiClient';

export interface CountryInfo {
  code: string;
  name: string;
}

export interface StoreOption {
  id: string;
  name: string;
  countryCode?: string;
  country?: CountryInfo;
  platform?: string;
}

export interface FinanceOptions {
  paymentMethods: string[];
  invoiceStatuses: string[];
}

export interface ExpensePayload {
  expenseDate: string;
  itemDescription: string;
  amount: number;
  paymentMethod: string;
  payer: string;
  payee: string;
  invoiceStatus: string;
  isAdvancePayment: boolean;
  reimbursementDate?: string | null;
  storeId?: string | null;
  notes?: string | null;
}

export interface ExpenseRecord extends ExpensePayload {
  id: string;
  store?: StoreOption;
  enteredBy?: { nickname: string };
  canManage?: boolean;
}

export interface ExpenseListResponse {
  data: ExpenseRecord[];
  page?: number;
  total?: number;
}

export const financeService = {
  async getStores() {
    const response = await apiClient.get<StoreOption[]>('/stores-list');
    return response.data;
  },

  async getOptions() {
    const response = await apiClient.get<FinanceOptions>('/expenses/options');
    return response.data;
  },

  async createExpense(payload: ExpensePayload) {
    const response = await apiClient.post<ExpenseRecord>('/expenses', payload);
    return response.data;
  },

  async updateExpense(id: string, payload: ExpensePayload) {
    const response = await apiClient.put<ExpenseRecord>(`/admin/expenses/${id}`, payload);
    return response.data;
  },

  async listExpenses(params: Record<string, any>) {
    const response = await apiClient.get<ExpenseListResponse | ExpenseRecord[]>('/admin/expenses', { params });
    return response.data;
  },

  async deleteExpense(id: string) {
    await apiClient.delete(`/admin/expenses/${id}`);
  },

  async importExpenses(formData: FormData) {
    const response = await apiClient.post('/admin/expenses/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async exportExpenses(params: Record<string, any>) {
    const response = await apiClient.get<Blob>('/admin/expenses/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

export default financeService;

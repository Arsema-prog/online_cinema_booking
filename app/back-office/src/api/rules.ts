import type { RuleSet } from '@/types';
import { apiClient } from './httpClient';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const getRulesets = (page = 0, size = 10) => 
  apiClient.get<PageResponse<RuleSet>>(`/api/v1/support/rules?page=${page}&size=${size}`);

export const getActiveRuleset = () => 
  apiClient.get<RuleSet>('/api/v1/support/rules/active');

export const activateRuleset = (id: number) => 
  apiClient.post<void>(`/api/v1/support/rules/${id}/activate`);

export const deactivateRuleset = (id: number) => 
  apiClient.post<void>(`/api/v1/support/rules/${id}/deactivate`);

export const deleteRuleset = (id: number) => 
  apiClient.delete<void>(`/api/v1/support/rules/${id}`);

export const uploadRuleset = (file: File, version?: string, activate: boolean = false) => {
  const formData = new FormData();
  formData.append('file', file);
  if (version) formData.append('version', version);
  formData.append('activate', String(activate));

  return apiClient.post<RuleSet>('/api/v1/support/rules', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

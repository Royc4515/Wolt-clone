import { apiFetch } from './api';

export const getUser = async (id) => {
  return await apiFetch(`/api/users/${id}`, { method: 'GET' });
};

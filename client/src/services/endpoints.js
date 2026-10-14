import api from './api.js';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  removeMember: (id, memberId) => api.delete(`/projects/${id}/members/${memberId}`),
};

export const meetingsAPI = {
  getAll: (params) => api.get('/meetings', { params }),
  getByProject: (projectId, params) => api.get(`/meetings/project/${projectId}`, { params }),
  getById: (id) => api.get(`/meetings/${id}`),
  create: (data) => api.post('/meetings', data),
  update: (id, data) => api.put(`/meetings/${id}`, data),
  delete: (id) => api.delete(`/meetings/${id}`),
  uploadRecording: (id, formData) =>
    api.post(`/meetings/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000, // 5 min for large uploads
    }),
  getDashboard: () => api.get('/meetings/dashboard'),
  reanalyze: (id) => api.post(`/meetings/${id}/reanalyze`),
  getDecisions: (id) => api.get(`/meetings/${id}/decisions`),
  getActionItems: (id) => api.get(`/meetings/${id}/action-items`),
  getRisksAndBlockers: (id) => api.get(`/meetings/${id}/risks-blockers`),
  chat: (id, query) => api.post(`/meetings/${id}/chat`, { query }),
  exportMinutes: (id, format = 'markdown') =>
    api.get(`/meetings/${id}/export?format=${format}`, { responseType: 'blob' }),
  sendEmail: (id, data) => api.post(`/meetings/${id}/send-email`, data),
};

export const participantsAPI = {
  getByProject: (projectId) => api.get(`/participants/project/${projectId}`),
  create: (data) => api.post('/participants', data),
  update: (id, data) => api.put(`/participants/${id}`, data),
  delete: (id) => api.delete(`/participants/${id}`),
};

export const actionItemsAPI = {
  getAll: (params) => api.get('/action-items', { params }),
  update: (id, data) => api.patch(`/action-items/${id}`, data),
  delete: (id) => api.delete(`/action-items/${id}`),
};

export const decisionsAPI = {
  getAll: (params) => api.get('/decisions', { params }),
};

export const systemAPI = {
  getStatus: () => api.get('/system/status'),
};

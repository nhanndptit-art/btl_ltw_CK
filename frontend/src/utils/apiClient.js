const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const authFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('cyber_token');
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('cyber_user');
    localStorage.removeItem('cyber_token');
    window.location.href = '/login';
    throw new Error(data.message || 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
  }

  if (!response.ok) {
    throw new Error(data.message || 'Có lỗi xảy ra khi gọi máy chủ.');
  }

  return data;
};
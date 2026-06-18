const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const API_ENDPOINTS = {
  authLogin: `${API_BASE_URL}/auth/login`,
  authRegister: `${API_BASE_URL}/auth/register`,
  authGoogle: `${API_BASE_URL}/auth/google`,
  authMe: `${API_BASE_URL}/auth/me`,

  classify: `${API_BASE_URL}/classify`,
  summarize: `${API_BASE_URL}/summarize`,
  meeting: `${API_BASE_URL}/meeting`,

  qaIndex: `${API_BASE_URL}/qa/index`,
  qaAsk: `${API_BASE_URL}/qa/ask`,
  qaReset: `${API_BASE_URL}/qa/reset`,

  historyDocuments: `${API_BASE_URL}/history/documents`,
  historyMeetings: `${API_BASE_URL}/history/meetings`,

  stats: `${API_BASE_URL}/stats`,
  divisions: `${API_BASE_URL}/divisions`,
};

export default API_BASE_URL;
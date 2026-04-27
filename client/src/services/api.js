import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

// Auth
export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);
export const getMe = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/profile', data);

// Hospitals
export const getHospitals = (params) => API.get('/hospitals', { params });
export const getHospital = (id) => API.get(`/hospitals/${id}`);
export const smartFind = (data) => API.post('/hospitals/smart-find', data);
export const updateBeds = (id, data) => API.put(`/hospitals/${id}/beds`, data);
export const updateCrowd = (id, data) => API.put(`/hospitals/${id}/crowd`, data);
export const getHospitalStats = (id) => API.get(`/hospitals/${id}/stats`);
export const createHospital = (data) => API.post('/hospitals', data);

// Appointments
export const bookAppointment = (data) => API.post('/appointments', data);
export const getMyAppointments = () => API.get('/appointments/my');
export const getAvailableSlots = (params) => API.get('/appointments/slots', { params });
export const emergencyRequest = (data) => API.post('/appointments/emergency', data);
export const getHospitalAppointments = (id, params) => API.get(`/appointments/hospital/${id}`, { params });
export const updateAppointmentStatus = (id, data) => API.put(`/appointments/${id}/status`, data);
export const cancelAppointment = (id) => API.put(`/appointments/${id}/cancel`);

// Records
export const getPatientRecords = (patientId) => API.get(`/records/patient/${patientId}`);
export const createRecord = (data) => API.post('/records', data);
export const analyzeReport = (data) => API.post('/records/analyze', data);

// Seed
export const seedData = () => API.post('/seed');

export default API;

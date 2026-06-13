import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const signup = (data) => api.post("/auth/signup", data);
export const login = (data) => api.post("/auth/login", data);

export const fetchProperty = (ulpin, requesterUserId) =>
  api.post("/property/fetch", { ulpin, requesterUserId });
export const analyzeProperty = (ulpin, combinedData) =>
  api.post("/property/analyze", { ulpin, combinedData });
export const getUserProperties = (userId) => api.get(`/property/user/${userId}`);
export const getPropertyByUlpin = (ulpin) => api.get(`/property/${ulpin}`);
export const payPropertyTax = (ulpin, year) => api.put(`/property/${ulpin}/tax/pay`, { year });

export const initiateTransfer = (data) => api.post("/transfer/initiate", data);
export const sellerSign = (transferId) => api.post("/transfer/seller-sign", { transferId });
export const buyerSign = (transferId) => api.post("/transfer/buyer-sign", { transferId });
export const buyerDecline = (transferId) => api.post("/transfer/buyer-decline", { transferId });

export const registrarApprove = (transferId) =>
  api.post("/transfer/registrar-approve", { transferId });
export const registrarDecline = (transferId, comment) =>
  api.post("/transfer/registrar-decline", { transferId, comment });

export const panchayatApprove = (transferId) =>
  api.post("/transfer/panchayat-approve", { transferId });
export const panchayatDecline = (transferId, comment) =>
  api.post("/transfer/panchayat-decline", { transferId, comment });

export const confirmPayment = (transferId, paymentRef) =>
  api.post("/transfer/payment", { transferId, paymentRef });

export const getTransfer = (id) => api.get(`/transfer/${id}`);
export const getUserTransfers = (userId) => api.get(`/transfer/user/${userId}`);
export const getAllTransfers = () => api.get("/transfer");

export const getNotifications = (userId) => api.get(`/notifications/${userId}`);
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);

export const getBlockchain = (ulpin) => api.get(`/blockchain/${ulpin}`);
export const verifyBlockchain = (ulpin) => api.get(`/blockchain/verify/${ulpin}`);

export default api;

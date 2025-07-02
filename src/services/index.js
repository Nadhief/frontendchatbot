import api from "./api.js";

export const registerUser = async (data) => {
  const response = await api.post("/users", data);
  return response.data;
};

export const loginUser = async (data) => {
  const response = await api.post("/api/login", data);
  return response.data;
};

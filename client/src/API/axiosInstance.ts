import axios from "axios";

const isServer = typeof window === "undefined";
const apiUrl =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://githuv.onrender.com"
    : "http://localhost:4002");

export const axiosInstance = axios.create({
  baseURL: isServer ? apiUrl : "",
  withCredentials: true,
});

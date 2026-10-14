import axios from "axios";

const isServer = typeof window === "undefined";
const apiUrl =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4002";

export const axiosInstance = axios.create({
  baseURL: isServer ? apiUrl : "",
  withCredentials: true,
});

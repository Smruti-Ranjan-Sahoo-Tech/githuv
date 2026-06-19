import axios from "axios";
export const axiosInstance = axios.create({
    baseURL: "http://localhost:4002",
    withCredentials: true,
});
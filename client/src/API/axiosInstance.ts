import axios from "axios";
export const axiosInstance = axios.create({
    baseURL: "https://githuv.onrender.com",
    withCredentials: true,
});
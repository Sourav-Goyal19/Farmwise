import axios from "axios";

const axiosIns = axios.create({
  baseURL: process.env.SERVER_URL || "https://farmwise-backend.vercel.app" || "http://localhost:8000",
  withCredentials: true,
});

export { axiosIns };

import axios from "axios";

const axiosIns = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:8000",
  withCredentials: true,
});

export { axiosIns };

import { create } from "zustand";
import { UserType } from "@/types";
import { Socket, io } from "socket.io-client";

type UserStoreType = {
  user: UserType | null;
  setUser: (user: UserType) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserStoreType>((set) => ({
  user: null,
  setUser: (user) => set({ user: user }),
  clearUser: () => set({ user: null }),
}));

type SocketStoreType = {
  socket: Socket | null;
  setSocket: (skt: Socket) => void;
  initializeSocket: () => Socket;
  disconnectSocket: () => void;
  isConnected: boolean;
};

export const useSocketStore = create<SocketStoreType>((set, get) => ({
  socket: null,
  isConnected: false,
  setSocket: (skt) => set({ socket: skt }),
  initializeSocket: () => {
    const existingSocket = get().socket;

    if (existingSocket && existingSocket.connected) {
      return existingSocket;
    }

    const newSocket = io(process.env.NEXT_PUBLIC_SERVER_URL!, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      set({ isConnected: true });
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      set({ isConnected: false });
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      set({ isConnected: false });
    });

    set({ socket: newSocket });
    return newSocket;
  },
  disconnectSocket: () => {
    const existingSocket = get().socket;
    if (existingSocket) {
      existingSocket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
}));

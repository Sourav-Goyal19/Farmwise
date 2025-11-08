import { Server as HTTPServer } from "http";
import { Server as SocketIoServer } from "socket.io";

let io: SocketIoServer | null = null;

const initSocket = (server: HTTPServer) => {
  io = new SocketIoServer(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected", socket.id);

    socket.on("join-notifications", (farmerId) => {
      socket.join(`notification:${farmerId}`);
      console.log("socket joined notification-room", farmerId);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected", socket.id);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error("Socket is not intialized");
  }

  return io;
};

export { initSocket, getIo };

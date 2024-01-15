import WebSocket from "ws";
import msgpack from "msgpack-lite";
import { createLobby, joinLobby, setColor, lobbies, endGame } from "./lobbies";

export const handleUpgrade = (
  request: any,
  socket: any,
  head: Buffer,
  wss: WebSocket.Server
) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
    setupWebSocket(ws);
  });
};

export let send: any = null;
function generateRandomId(length: number): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomId = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomId += characters.charAt(randomIndex);
  }

  return randomId;
}

export const setupWebSocket = (ws: any) => {
  ws.sid = generateRandomId(16);

  send = (message: any, target?: WebSocket | WebSocket[]) => {
    const encodedMessage = msgpack.encode(message);

    if (target) {
      if (Array.isArray(target)) {
        target.forEach((targetWs) => {
          targetWs.send(encodedMessage);
        });
      } else {
        target.send(encodedMessage);
      }
    } else {
      ws.send(encodedMessage);
    }
  };

  ws.on("message", (data: WebSocket.Data) => {
    const message = decodeMessage(data);

    if (isFirstMessage(message)) {
      handleFirstMessage(ws, message);
    } else {
      handleReceivedMessage(ws, message);
    }
  });

  ws.on("close", () => {
    onClose(ws);
  });
};

const onClose = (ws: any): void => {
  const inLobby = lobbies.some((lobby) =>
    Object.values(lobby.players).some((player) => player.ws === ws)
  );

  if (inLobby) {
    const lobby = lobbies.find((lobby) =>
      Object.values(lobby.players).some((player) => player.ws === ws)
    );

    if (lobby) {
      endGame(lobby, true);
    }
  }
};

const decodeMessage = (data: WebSocket.Data): any => {
  return msgpack.decode(data as Buffer);
};

const isFirstMessage = (message: any): boolean => {
  return message.type === "version" && message.data === "TTT-1";
};

const handleFirstMessage = (ws: WebSocket, message: any) => {
  if (!isFirstMessage(message)) {
    console.error("Invalid first message. Closing WebSocket connection.");
    ws.terminate();
    return;
  }

  send({ type: "verified", data: "success." });
};

const handleReceivedMessage = (ws: WebSocket, message: any) => {
  switch (message.type) {
    case "create-lobby":
      createLobby(message.data, ws);
      break;
    case "join-lobby":
      joinLobby(message.data, ws);
      break;
    case "set-color":
      setColor(message.data, ws);
      break;
    case "cancel-lobby":
      console.log("canceled search.");
      break;
    default:
      console.warn("Unknown message type:", message.type);
  }
};

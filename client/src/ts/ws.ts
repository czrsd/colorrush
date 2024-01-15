import { endGame, updateGame } from "./game";
import { setAlert } from "./helpers";
import socket from "./socket";
import { onClose, onError, onJoin, onSuccess } from "./upload";

export const wsSend = socket.send.bind(socket);
export let wsOpen: boolean = false;
const wsUrl = "wss://app.czrsd.com/colorrush/server/ws";

interface Message {
  type: string;
  data: any;
}

export function initSocket() {
  socket.connect(wsUrl);

  socket.onopen(() => {
    wsOpen = true;
    wsSend({
      type: "version",
      data: "TTT-1",
    });
  });

  socket.onclose(() => {
    wsOpen = false;
    console.error("WebSocket connection lost.");
  });

  socket.onerror((err: any) => {
    console.error(`WebSocket error: ${err}`);
  });

  socket.handle((msg: Message) => {
    const type: string = msg.type;
    const data = msg?.data;

    switch (type) {
      case "verified":
        console.log("verified.");
        break;
      case "lobby-created":
        onSuccess();
        break;
      case "lobby-failed":
        onError(data);
        break;
      case "close-lobby":
        onClose(data);
        break;
      case "join-lobby":
        onJoin(data);
        break;
      case "invalid-lobby":
        setAlert(data, "danger");
        break;
      case "update-field":
        updateGame(data);
        break;
      case "game-end":
        endGame(data);
        break;
      case "connection-lost":
        location.reload();
        break;
      default:
        console.warn("Unknown message type:", type);
    }
  });
}

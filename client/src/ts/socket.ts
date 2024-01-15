import msgpack from "msgpack-lite";

export interface Message {
  type: string;
  data: any;
}

class Socket {
  private socket: WebSocket | null = null;
  private messageHandler: ((msg: Message) => void) | null = null;

  constructor() {}

  connect(url: string): Socket {
    this.socket = new WebSocket(url);
    this.socket.binaryType = "arraybuffer";

    this.socket.onmessage = (event: MessageEvent) => {
      const decodedData = msgpack.decode(new Uint8Array(event.data));

      if (this.messageHandler) {
        this.messageHandler(decodedData);
      }
    };

    return this;
  }

  send(data: { type: string; data: any }): Socket {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const encodedData = msgpack.encode(data);
      this.socket.send(encodedData);
    }

    return this;
  }

  handle(callback: (msg: Message) => void): Socket {
    this.messageHandler = callback;
    return this;
  }

  onerror(callback: (error: Event) => void): Socket {
    if (this.socket) {
      this.socket.onerror = callback;
    }
    return this;
  }

  onopen(callback: (event: Event) => void): Socket {
    if (this.socket) {
      this.socket.onopen = callback;
    }
    return this;
  }

  onclose(callback: (event: CloseEvent) => void): Socket {
    if (this.socket) {
      this.socket.onclose = callback;
    }
    return this;
  }
}

const socket = new Socket();
export default socket;

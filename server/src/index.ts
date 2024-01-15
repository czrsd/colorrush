import express from "express";
import http from "http";
import WebSocket from "ws";
import { handleUpgrade } from "./WebSocket/socket"; // Import only handleUpgrade, not setupWebSocket
import cors from "cors";
import {} from "./routes/routes";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

app.use(
  cors({
    origin: ["http://localhost:5173", "https://app.czrsd.com"],
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

server.on("upgrade", (request, socket, head) => {
  if (request.url === "/ws") {
    handleUpgrade(request, socket, head, wss);
  } else {
    socket.destroy();
  }
});

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  next();
});

const APP_ROUTE: string = "/colorrush/api";

const PORT = 3081;

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

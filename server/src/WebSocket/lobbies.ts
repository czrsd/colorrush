import { send } from "./socket";

interface Player {
  color: string;
  score: number;
  ws: any;
}

interface Lobby {
  id: string;
  players: { [key: string]: Player };
  board: number; // Changed board type to number
  fields: (string | null)[]; // Updated fields type
  minutes: number;
  joined: number;
}

export const lobbies: Lobby[] = [];

export function createLobby(data: any, ws: any) {
  const { board, minutes, colors, link } = data;

  const parsedMinutes = parseInt(minutes, 10);

  if (
    !isValidBoard(board) ||
    !isValidMinutes(parsedMinutes) ||
    !isValidColors(colors) ||
    !isValidLink(link)
  ) {
    sendLobbyFailed("Invalid Data");
    return;
  }

  if (isLinkAlreadyUsed(link)) {
    sendLobbyFailed("Link already in use");
    return;
  }

  const newLobby: Lobby = {
    id: link,
    players: createPlayers(colors, ws),
    board: parseInt(board, 10), // Parse board as number
    fields: createFields(parseInt(board, 10)), // Create fields based on board size
    minutes: parsedMinutes,
    joined: 1,
  };

  lobbies.push(newLobby);
  send(
    {
      type: "lobby-created",
      data: newLobby,
    },
    ws
  );
  ws.lobby = link;
  console.log("Created new lobby!");
}

function createPlayers(colors: any, ws: any): { [key: string]: Player } {
  const { color1, color2 } = colors;
  return {
    "Player 1": { color: color1, score: 0, ws: ws },
    "Player 2": { color: color2, score: 0, ws: null },
  };
}

function createFields(board: number): (string | null)[] {
  const size = board * board;
  const fields: (string | null)[] = Array(size).fill(null);
  return fields;
}

function isValidBoard(board: string): boolean {
  return ["10", "15", "20"].includes(board);
}

function isValidMinutes(minutes: number): boolean {
  return typeof minutes === "number" && minutes > 0 && minutes <= 10;
}

function isValidColors(colors: any): boolean {
  if (colors && typeof colors === "object") {
    const { color1, color2 } = colors;

    const validColors = isValidHexColor(color1) && isValidHexColor(color2);

    const differentColors = color1 !== color2;

    return validColors && differentColors;
  }

  return false;
}

function isValidHexColor(color: string): boolean {
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return typeof color === "string" && hexColorRegex.test(color);
}

function isValidLink(link: string): boolean {
  const linkRegex = /^[A-Za-z0-9]+$/;
  return typeof link === "string" && link.trim() !== "" && linkRegex.test(link);
}

function isLinkAlreadyUsed(link: string): boolean {
  return lobbies.some((lobby) => lobby.id === link);
}

function sendLobbyFailed(reason: string) {
  const message = {
    type: "lobby-failed",
    data: `Failed to create lobby: ${reason}`,
  };
  send(message);
}

// JOIN LOBBIES

export function joinLobby(id: string, ws: any) {
  console.log(`searching for lobby: ${id}`);
  if (!id || !isValidLink(id) || !isLinkAlreadyUsed(id)) {
    send(
      {
        type: "invalid-lobby",
        data: "Lobby does not exist.",
      },
      ws
    );
    return;
  }

  const lobby = lobbies.find((l) => l.id === id);

  if (lobby && lobby.joined === 1) {
    ws.lobby = id;

    const emptySlot = Object.keys(lobby.players).find(
      (key) => lobby.players[key].ws === null
    );

    if (emptySlot) {
      lobby.players[emptySlot].ws = ws;
      const websockets = Object.values(lobby.players).map(
        (player) => player.ws
      );
      websockets.forEach((socket) => {
        send(
          {
            type: "join-lobby",
            data: {
              id: lobby.id,
              players: Object.fromEntries(
                Object.entries(lobby.players).map(([key, value]) => [
                  key,
                  { color: value.color, score: value.score },
                ])
              ),
              minutes: lobby.minutes,
              board: lobby.board,
            },
          },
          socket
        );
      });
      const timeInSeconds = lobby.minutes * 60;
      startGame(websockets, timeInSeconds, lobby);
    } else {
      send(
        {
          type: "lobby-full",
          data: "Lobby is already full.",
        },
        ws
      );
    }
  } else {
    send(
      {
        type: "invalid-lobby",
        data: "Couldn't join lobby.",
      },
      ws
    );
  }
}

// handle game

function startGame(websockets: any[], seconds: number, lobby: any) {
  let intervalId: any = null;
  let currentSecond = 0;
  let gameEnded = false;

  setTimeout(() => {
    intervalId = setInterval(() => {
      if (currentSecond === seconds && !gameEnded) {
        clearInterval(intervalId);
        intervalId = null;

        const simplifiedGameData = {
          id: lobby.id,
          players: Object.fromEntries(
            Object.entries(lobby.players).map(([key, value]: any) => [
              key,
              { color: value.color, score: value.score },
            ])
          ),
          minutes: lobby.minutes,
          board: lobby.board,
        };

        websockets.forEach((socket) => {
          send(
            {
              type: "game-end",
              data: simplifiedGameData,
            },
            socket
          );
        });

        endGame(lobby);
        gameEnded = true;
        return;
      }
      currentSecond++;
    }, 1000);
  }, 3000);
}

function inLobby(sid: string): boolean {
  return lobbies.some((lobby) =>
    Object.values(lobby.players).some(
      (player) => player.ws && player.ws.sid === sid
    )
  );
}

export function setColor(fieldId: number, ws: any) {
  if (!ws || !ws.sid || !ws.lobby) return;

  const lobby = lobbies.find((l) => l.id === ws.lobby);

  if (!lobby || !lobby.players) return;

  const player = Object.values(lobby.players).find(
    (p) => p.ws && p.ws.sid === ws.sid
  );

  if (!player || player.color === null) return;

  const fieldRow = Math.floor((fieldId - 1) / lobby.board);
  const fieldCol = (fieldId - 1) % lobby.board;
  const fieldIndex = fieldRow * lobby.board + fieldCol;

  const currentFieldColor = lobby.fields[fieldIndex];

  if (currentFieldColor === player.color) {
    return; // Do nothing if the field is already taken by the player
  } else if (currentFieldColor === null) {
    lobby.fields[fieldIndex] = player.color;
    player.score += 1;
  } else {
    const opponentKey = Object.keys(lobby.players).find(
      (key) => lobby.players[key].color === currentFieldColor
    );

    if (opponentKey) {
      const opponent = lobby.players[opponentKey];
      opponent.score -= 1;
      player.score += 1;
      lobby.fields[fieldIndex] = player.color;
    }
  }

  const updateMessage = {
    type: "update-field",
    data: {
      players: Object.fromEntries(
        Object.entries(lobby.players).map(([key, p]) => [
          key,
          { color: p.color, score: p.score },
        ])
      ),
      field: fieldId,
      color: player.color,
    },
  };

  Object.values(lobby.players).forEach((p) => {
    if (p.ws) {
      send(updateMessage, p.ws);
    }
  });
}

// Close lobby

export function endGame(lobby: any, canceled: boolean = false) {
  console.log("Game has ended. Closing lobby:", lobby.id);
  if (canceled) {
    Object.values(lobby.players).forEach((player: any) => {
      if (player.ws) {
        send(
          {
            type: "connection-lost",
            data: null,
          },
          player.ws
        );
      }
    });
  }

  const lobbyIndex = lobbies.findIndex((l) => l.id === lobby.id);
  if (lobbyIndex !== -1) {
    lobbies.splice(lobbyIndex, 1);
    console.log("Lobby removed from lobbies array.");
  }

  Object.values(lobby.players).forEach((player: any) => {
    if (player.ws) {
      player.ws.terminate();
      console.log("WebSocket connection closed for player:", player.ws.sid);
    }
  });

  console.log("Lobby cleanup complete.");
}

import { toggleVisibility } from "./menu";
import { wsOpen, wsSend } from "./ws";
import { setAlert } from "./helpers";
import { startGame } from "./game";
import $ from "jquery";

let lobbyCreated: boolean = false;
let creator: boolean = false;
let waitingInterval: any = null;
let gameStarted: boolean = false;
let lobbyId: any = "";
const getInvLink = (id: any) => `https://app.czrsd.com/colorrush/?join=${id}`;

export function onUpload() {
  if (lobbyCreated) return;
  const board = $("#boardSelect");
  const mins = $("#mins");
  const p1 = $("#p1");
  const p2 = $("#p2");
  const invLink = $("#invLink");

  const boardSize = board.val();
  const minutes = mins.val();
  const color1 = p1.val();
  const color2 = p2.val();
  const link = invLink.val();
  lobbyId = link;

  if (!board || !mins || !p1 || !p2 || !invLink) return;
  if (wsOpen) {
    try {
      wsSend({
        type: "create-lobby",
        data: {
          board: boardSize,
          minutes,
          colors: {
            color1,
            color2,
          },
          link,
        },
      });
    } catch (error) {
      console.error("Error sending create-lobby message:", error);
    }
  } else {
    console.error("WebSocket connection is not open.");
  }
}

export function onSuccess() {
  lobbyCreated = true;
  creator = true;
  toggleVisibility($("#createLobby"), true);
  toggleVisibility($("#lobby"), false);

  const text = $("#waiting");
  const players = $("#players");
  const inviteLink = $("#inviteLink");
  const invLinkCopy = $("#invLinkCopy");
  const copyId = $("#copyId");
  invLinkCopy.show();
  inviteLink.val(getInvLink(lobbyId));
  copyId.on("click", () => {
    navigator.clipboard.writeText(String(inviteLink.val())).then(() => {
      setAlert("Copied Link!", "success");
    });
  });

  players.html("(1/2)");
  let dots = 0;

  waitingInterval = setInterval(() => {
    dots = dots === 3 ? 0 : dots + 1;
    const dotsString = ".".repeat(dots);
    text.html(`Waiting for another player${dotsString}`);
  }, 500);
}
export function onError(msg: any) {
  console.error("Error creating lobby: ", msg);
  setAlert("Invalid data. Please try again.", "danger");
}

export function onClose(data: any) {
  lobbyCreated = false;
  console.error(`Closed Lobby: `, data);
}

export function onJoin(data: any) {
  const startText = $("#startingText");
  if (creator) {
    clearInterval(waitingInterval);
    waitingInterval = null;
    $("#waiting").html("Starting game!");
    $("#players").html("(2/2)");
    startText.show();
  } else {
    const lobby = $("#lobby");

    toggleVisibility($("#joinLobby"), true);
    toggleVisibility($("#menu"), true);
    toggleVisibility(lobby);
    const waiting = $("#waiting");
    const players = $("#players");
    if (waiting && players && startText) {
      waiting.remove();
      players.remove();
      startText.show();
    }
  }

  const startTime = Date.now();

  let startInterval: any = setInterval(() => {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    const remainingTime = Math.max(3 - elapsedTime, 0);

    startText.html(`Starting in ${remainingTime}`);

    if (elapsedTime >= 3) {
      clearInterval(startInterval);
      startInterval = null;
      if (gameStarted) return;
      gameStarted = true;
      startGame(data);
    }
  }, 1000);
}

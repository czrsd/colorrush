import $ from "jquery";
import { wsSend } from "./ws";

interface Player {
  color: string;
  score: number;
  ws: any;
}

interface Field {
  [key: number]: string | null;
}

interface Lobby {
  id: string;
  players: { [key: string]: Player };
  board: string;
  fields: Field[];
  minutes: number;
  joined: number;
}

let gameWrapper: any = null;

export function startGame(data: any) {
  // remove menu
  const menuWrapper = $("#main_wrapper");
  menuWrapper.remove();

  // Render game wrapper
  const main = $("main");

  gameWrapper = $(`
    <div class="flex flex-col gap-5 justify-center items-center text-center bg-black/50 backdrop-blur-lg p-10 lg:rounded-3xl w-full h-full lg:w-[800px] lg:h-[800px] lg:min-w-[800px] lg:min-h-[800px] lg:max-w-[800px] lg:max-h-[800px]" id="board_wrapper" style="display: none">
        <span class="relative text-xl" id="timeLeft">Time left: 0m0s</span>
        <span class="relative text-lg" id="player1Text">Player 1: 0</span>
        <div class="w-full h-full lg:w-[600px] lg:h-[600px] lg:min-w-[600px] lg:min-h-[600px] lg:max-w-[600px] lg:max-h-[600px]">
            <div class="aspect-square grid" id="board"></div>
        </div>
        <span class="relative text-lg" id="player2Text">Player 2: 0</span>
    </div>
  `)
    .appendTo(main)
    .fadeIn();

  // Render board
  const boardSize: number = parseInt(data.board, 10);
  const $board = $("#board");

  const fieldSize = 520 / boardSize;

  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const id = row * boardSize + col + 1;
      const $field = $('<div class="field"></div>');
      $field.attr("data-id", id);

      $field.on("click", function () {
        const fieldId = $(this).attr("data-id");
        wsSend({
          type: "set-color",
          data: fieldId,
        });
      });

      $field.css({
        width: fieldSize + "px",
        height: fieldSize + "px",
      });

      $board.append($field);
    }
  }

  $board.css({
    display: "grid",
    gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
    gridTemplateRows: `repeat(${boardSize}, 1fr)`,
    gap: "1px",
  });

  // set timer
  const timeLeft = $("#timeLeft");
  let secondsLeft = data.minutes * 60;

  function updateTimer() {
    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      return;
    }

    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    timeLeft.text(`Time left: ${minutes}m${seconds}s`);
    secondsLeft--;
  }

  const timerInterval = setInterval(updateTimer, 1000);
}

export function updateGame(data: any) {
  const player1 = data.players["Player 1"];
  const player2 = data.players["Player 2"];
  const updatedField = data.field;

  $("#player1Text").text(`Player 1: ${player1.score}`);
  $("#player2Text").text(`Player 2: ${player2.score}`);

  const field = $(`[data-id="${updatedField}"]`);
  field.css({
    background: data.color,
  });
}

export function endGame(lobby: Lobby) {
  gameWrapper.remove();

  const main = $("main");
  const winner = getWinner(lobby);

  $(`
      <div class="flex flex-col gap-5 justify-center items-center text-center bg-black/50 backdrop-blur-lg p-10 lg:rounded-3xl w-full h-full lg:w-[800px] lg:h-[800px] lg:min-w-[800px] lg:min-h-[800px] lg:max-w-[800px] lg:max-h-[800px]" id="board_wrapper" style="display: none">
          <span>${winner ? `Winner: ${winner}` : "It's a draw!"}</span>
          <button class="bg-black hover:bg-black/70 rounded-lg p-2 px-5 transition-all duration-300 outline-none min-w-[200px] flex items-center justify-center gap-3 text-lg" id="menuButton">Go to Menu</button>
      </div>
    `)
    .appendTo(main)
    .fadeIn();

  $("#menuButton").on("click", function () {
    location.reload();
  });

  console.log(`Closed lobby: ${lobby}`);
}

function getWinner(lobby: Lobby): string | null {
  const player1 = lobby.players["Player 1"];
  const player2 = lobby.players["Player 2"];

  if (player1.score > player2.score) {
    return "Player 1";
  } else if (player1.score < player2.score) {
    return "Player 2";
  } else {
    return null;
  }
}

export function joinLobby(id: any) {
  wsSend({
    type: "join-lobby",
    data: id,
  });
}

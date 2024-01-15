import $ from "jquery";
import "./css/style.css";
import { initSocket, wsOpen } from "./ts/ws";
import { menuFunctions as initMenu } from "./ts/menu";
import { randomId } from "./ts/helpers";
import { onUpload } from "./ts/upload";
import { joinLobby } from "./ts/game";

function init(): void {
  initSocket();
  initMenu();
  const upload = $("#uploadLobby");
  const invLinkJoinBtn = $("#invLinkJoinBtn");
  const invLinkJoin = $("#invLinkJoin");

  invLinkJoinBtn.on("click", () => {
    if (!wsOpen) return;
    console.log("test");
    const link = invLinkJoin.val();
    const linkString = link?.toString();
    const joinLink = "https://app.czrsd.com/colorrush/?join=";

    if (linkString?.includes(joinLink)) {
      const lobbyId = linkString.replace(joinLink, "");
      joinLobby(lobbyId);
    } else {
      joinLobby(linkString);
    }
  });

  upload.on("click", onUpload);
  const invLink = $("#invLink");

  const rdmId: string = randomId(5);
  invLink.val(rdmId);

  let checkwsopen: any = setInterval(() => {
    if (!wsOpen) return;
    clearInterval(checkwsopen);
    checkwsopen = null;
    const queryParams = new URLSearchParams(window.location.search);

    if (queryParams.has("join")) {
      const joinValue = queryParams.get("join");

      queryParams.delete("join");

      history.replaceState(
        {},
        document.title,
        window.location.pathname + "" + queryParams
      );

      joinLobby(joinValue);
    }
  });
}

$(document).ready(init);

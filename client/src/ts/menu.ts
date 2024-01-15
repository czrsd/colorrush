import $ from "jquery";

export function menuFunctions() {
  const menu = $("#menu");
  const createLobby = $("#createLobby");
  const c_lobby = $("#c_lobby");
  const j_lobby = $("#j_lobby");
  const joinLobby = $("#joinLobby");
  const backBtn = $(".menu-back");
  const tutBtn = $("#tutorialBtn");
  const tut = $("#tutorial");
  const englishBtn = $("#englishBtn");
  const germanBtn = $("#germanBtn");
  const english = $("#english");
  const german = $("#german");

  let selectedLang: string = "english";

  backBtn.on("click", () => {
    toggleVisibility(menu);
    toggleVisibility(createLobby, true);
    toggleVisibility(joinLobby, true);
    toggleVisibility(tut, true);
  });

  c_lobby.on("click", function () {
    toggleVisibility(menu, true);
    toggleVisibility(createLobby);
  });

  j_lobby.on("click", () => {
    toggleVisibility(menu, true);
    toggleVisibility(joinLobby);
  });

  tutBtn.on("click", () => {
    toggleVisibility(menu, true);
    toggleVisibility(tut);
  });

  englishBtn.on("click", () => {
    if (selectedLang == "english") return;
    toggleVisibility(english);
    toggleVisibility(german, true);
    selectedLang = "english";
  });
  germanBtn.on("click", () => {
    if (selectedLang == "german") return;
    toggleVisibility(german);
    toggleVisibility(english, true);
    selectedLang = "german";
  });
}

export function toggleVisibility(
  element: JQuery<HTMLElement>,
  hide: boolean = false
): void {
  const action = hide ? "hide" : "toggle";

  element.animate(
    {
      height: action,
      opacity: action,
    },
    "fast"
  );
}

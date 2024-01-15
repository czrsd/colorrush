export function randomId(length: number): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join("");
}

export function setAlert(text: string, type: string) {
  const overlay = document.querySelector("#alert_overlay");
  if (!overlay) return;
  const alertWrapper = document.createElement("div");
  alertWrapper.classList.add("infoAlert");
  if (type == "success") {
    alertWrapper.classList.add("modAlert-success");
  } else if (type == "danger") {
    alertWrapper.classList.add("modAlert-danger");
  } else if (type == "default") {
    alertWrapper.classList.add("modAlert-default");
  }

  alertWrapper.innerHTML = `
        <span>${text}</span>
        <div class="modAlert-loader"></div>
    `;

  overlay.append(alertWrapper);

  setTimeout(() => {
    alertWrapper.remove();
  }, 2000);
}

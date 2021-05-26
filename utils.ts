export function appendChatLine(el: Element, message: string, color = "pink") {
  const container = document.createElement("p");

  const time = new Date();
  const timeArr = [time.getHours(), time.getMinutes(), time.getSeconds()].map(
    val => (val < 10 ? `0${val}` : `${val}`)
  );
  const timeEl = document.createElement("span");
  timeEl.classList.add(`text-${color}-500`);
  timeEl.innerHTML = `[${timeArr.join(":")}]:&nbsp;`;

  const messageEl = document.createElement("span");
  timeEl.classList.add("text-blue-500");
  messageEl.innerHTML = message;

  container.appendChild(timeEl);
  container.appendChild(messageEl);

  el.appendChild(container);
  el.scrollTo({ top: el.scrollHeight });
}

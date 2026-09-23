const pid = (code: string) => `den:player:${code}`;
const nameKey = (code: string) => `den:name:${code}`;

export function savedPlayer(code: string) {
  return {
    playerId: localStorage.getItem(pid(code)),
    name: localStorage.getItem(nameKey(code)),
  };
}

export function rememberPlayer(code: string, playerId: string, name: string) {
  localStorage.setItem(pid(code), playerId);
  localStorage.setItem(nameKey(code), name);
}

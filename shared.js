const keyboard = [
  ["A","日"],["B","月"],["C","金"],["D","木"],["E","水"],["F","火"],
  ["G","土"],["H","竹"],["I","戈"],["J","十"],["K","大"],["L","中"],
  ["M","一"],["N","弓"],["O","人"],["P","心"],["Q","手"],["R","口"],
  ["S","尸"],["T","廿"],["U","山"],["V","女"],["W","田"],["Y","卜"]
];
const rootByCode = Object.fromEntries(keyboard);
rootByCode.X = "難";
window.MANCHAI_STORAGE = {
  failed:false,
  read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (_) { return fallback; }
  },
  write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (_) { this.failed = true; }
    this.showStatus();
  },
  mergeCompleted(key, values) {
    const stored = this.read(key, []);
    const merged = [...new Set([...(Array.isArray(stored) ? stored.filter(value => typeof value === "string") : []), ...values])];
    this.write(key, merged);
    return merged;
  },
  showStatus() {
    const status = document.getElementById("local-progress-status");
    const message = window.MANCHAI_PROGRESS_COPY?.[this.failed ? "unavailable" : "saved"];
    if (status && message && status.textContent !== message) status.textContent = message;
    if (status) status.className = this.failed ? "storage-unavailable" : "";
  }
};

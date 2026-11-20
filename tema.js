/* Tema claro/escuro: segue o aparelho na primeira vez e lembra a escolha feita no botão. */
(function () {
  var CHAVE = "dimas.tema";
  function inicial() {
    var t = null;
    try { t = localStorage.getItem(CHAVE); } catch (e) {}
    if (t === "claro" || t === "escuro") return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "claro" : "escuro";
  }
  function aplicar(t) {
    document.documentElement.setAttribute("data-tema", t);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", t === "claro" ? "#ffffff" : "#0a0a0a");
  }
  aplicar(inicial());
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest("[data-tema-alternar]");
    if (!b) return;
    var t = document.documentElement.getAttribute("data-tema") === "claro" ? "escuro" : "claro";
    try { localStorage.setItem(CHAVE, t); } catch (e) {}
    aplicar(t);
  });
})();

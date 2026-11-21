/* DIMAS Adversários — app de visualização (celular e iPad). */
(function () {
  const { esc, imagem, midia, chave, dataHora } = DIMAS;
  const $ = (s, r) => (r || document).querySelector(s);
  const tela = $("#tela");
  let dados = DIMAS.normalizar(DIMAS.pacoteLocal());
  const estado = { equipeNaTela: "", filtro: "", atleta: null, equipe: null };
  const ehAdmin = () => { const s = DIMAS.sessao(); const lista = ((window.DIMAS_CONFIG || {}).ADMINS || []).map((x) => String(x).toLowerCase()); return !!s && lista.includes(String(s.email || "").toLowerCase()); };
  const IC_LAPIS = '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/></svg>';
  const IC_MOVER = '<svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/></svg>';

  const SETA = '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>';
  const IC_VIDEO = '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9.500v5l4.500-2.500z"/></svg>';
  const IC_DOC = '<svg viewBox="0 0 24 24"><path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7zM14 3v4h4M9 13h6M9 17h6"/></svg>';
  const IC_TEXTO = '<svg viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h9"/></svg>';
  const IC_LINK = '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';

  /* O Google às vezes recusa miniaturas quando muitas são pedidas juntas: tenta de novo antes de desistir. */
  window.imgFalhou = function (img) {
    const n = Number(img.dataset.tentativa || 0), id = DIMAS.driveId(img.src) || img.dataset.id;
    if (!id || n >= 3) { if (img.dataset.reserva) img.outerHTML = img.dataset.reserva; else img.remove(); return; }
    img.dataset.tentativa = n + 1; img.dataset.id = id;
    const largura = (img.src.match(/=w(\d+)/) || img.src.match(/sz=w(\d+)/) || [0, 300])[1];
    setTimeout(() => { img.src = n % 2 === 0 ? "https://drive.google.com/thumbnail?id=" + id + "&sz=w" + largura : "https://lh3.googleusercontent.com/d/" + id + "=w" + largura; }, 500 + n * 900);
  };

  /* ---------- peças ---------- */
  const iniciais = (nome) => String(nome).trim().split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  function avatar(a, largura) {
    if (/^foto:/.test(a.imagem || "")) return '<span class="avatar">' + esc(iniciais(a.nome)) + '<img alt="" hidden data-foto="' + esc(a.imagem.slice(5)) + '" data-doc="' + esc("fotos-" + DIMAS.slug(a.equipe)) + '"></span>';
    const src = imagem(a.imagem, largura || 160);
    return '<span class="avatar">' + esc(iniciais(a.nome)) + (src ? '<img loading="lazy" alt="" src="' + esc(src) + '" onerror="imgFalhou(this)">' : "") + "</span>";
  }
  function arte(url, nome, largura) {
    const sigla = '<span class="sigla">' + esc(iniciais(nome)) + "</span>";
    if (/^escudo:/.test(url || "")) return '<img alt="" hidden data-foto="' + esc(String(url).slice(7)) + '" data-doc="fotos-escudos">' + sigla; // escudo guardado na base
    const src = imagem(url, largura || 300);
    return src ? '<img loading="lazy" alt="" src="' + esc(src) + '" onerror="imgFalhou(this)" data-reserva="' + esc(sigla) + '">' : sigla;
  }
  const atletasDa = (equipe) => dados.atletas.filter((a) => a.equipeChave === equipe.elencoChave).sort((a, b) => a.ordem - b.ordem || a.linha - b.linha);
  const plural = (n, um, varios) => n + " " + (n === 1 ? um : varios);
  const linhaAtleta = (a) => [a.idade ? a.idade + " anos" : "", a.estatura, a.pe].filter(Boolean).join(" · ");

  /* ---------- telas ---------- */
  function telaInicio() {
    const cartoes = dados.competicoes.map((c) => {
      const n = dados.equipes.filter((e) => e.competicaoId === c.id).length;
      return '<a class="cartao" href="#/c/' + encodeURIComponent(c.id) + '"><span class="arte">' + arte(c.imagem, c.nome, 400) + "</span><strong>" + esc(c.nome) + "</strong><small>" + (n ? plural(n, "equipe", "equipes") : "Sem equipes") + "</small></a>";
    }).join("");
    tela.innerHTML = '<div class="cabecalho"><h1 class="titulo">Competições</h1></div>' +
      (cartoes ? '<div class="grade">' + cartoes + "</div>" : '<div class="vazio">' + (estado.carregando ? "Carregando dados…" : "Nenhuma competição cadastrada ainda.") + "</div>") +
      '<p class="rodape">' + plural(dados.equipes.length, "equipe", "equipes") + " · " + plural(dados.atletas.length, "atleta", "atletas") + "<br>Atualizado em " + esc(dataHora(dados.publicadoEm)) + "</p>";
  }

  function telaCompeticao(id) {
    const c = dados.competicoes.find((x) => x.id === id);
    if (!c) return telaInicio();
    const equipes = dados.equipes.filter((e) => e.competicaoId === id);
    const cartoes = equipes.map((e) => {
      const n = atletasDa(e).length;
      return '<a class="cartao" data-equipe="' + esc(e.id) + '" href="#/e/' + encodeURIComponent(e.id) + '"><span class="arte">' + arte(e.imagem, e.nome, 200) + "</span><strong>" + esc(e.nome) + "</strong>" + (n ? "<small>" + plural(n, "atleta", "atletas") + "</small>" : "") + "</a>";
    }).join("");
    const organizar = ehAdmin() && equipes.length > 1
      ? '<button class="botao contorno organizar" id="organizar" type="button">' + IC_MOVER + "<span>Organizar</span></button>" : "";
    tela.innerHTML = '<div class="cabecalho"><h1 class="titulo">' + esc(c.nome) + '</h1><div class="cabecalho-lado"><small>' + plural(equipes.length, "equipe", "equipes") + "</small>" + organizar + "</div></div>" +
      (organizar ? '<p class="dica-organizar" hidden>Arraste os clubes para mudar a ordem e toque em Concluir.</p>' : "") +
      (cartoes ? '<div class="grade equipes">' + cartoes + "</div>" : '<div class="vazio">Nenhuma equipe cadastrada nesta competição.</div>');
    if (organizar) $("#organizar").onclick = () => alternarOrganizar(c);
  }

  /* ---------- organizar clubes (só administrador): arrastar os cartões e gravar a ordem ---------- */
  function alternarOrganizar(c) {
    const grade = tela.querySelector(".grade.equipes"), botao = $("#organizar"), dica = tela.querySelector(".dica-organizar");
    if (!grade.classList.contains("organizando")) {
      grade.classList.add("organizando"); dica.hidden = false;
      botao.classList.remove("contorno"); botao.querySelector("span").textContent = "Concluir";
      grade.dataset.inicial = ordemNaTela(grade).join("|");
      return;
    }
    const nova = ordemNaTela(grade);
    grade.classList.remove("organizando"); dica.hidden = true;
    botao.classList.add("contorno"); botao.querySelector("span").textContent = "Organizar";
    if (nova.join("|") !== grade.dataset.inicial) salvarOrdem(c, nova, botao);
  }
  const ordemNaTela = (grade) => [...grade.querySelectorAll("[data-equipe]")].map((el) => el.dataset.equipe);

  let arrasto = null;
  tela.addEventListener("pointerdown", (ev) => {
    const cartao = ev.target.closest(".organizando [data-equipe]");
    if (!cartao || ev.button > 0) return;
    ev.preventDefault();
    arrasto = { cartao, id: ev.pointerId };
    cartao.classList.add("arrastando");
    cartao.setPointerCapture(ev.pointerId);
  });
  tela.addEventListener("pointermove", (ev) => {
    if (!arrasto || ev.pointerId !== arrasto.id) return;
    ev.preventDefault();
    const baixo = document.elementFromPoint(ev.clientX, ev.clientY);
    const alvo = baixo && baixo.closest(".organizando [data-equipe]");
    if (!alvo || alvo === arrasto.cartao) return;
    const r = alvo.getBoundingClientRect(), grade = alvo.parentElement;
    const depois = ev.clientX > r.left + r.width / 2;
    grade.insertBefore(arrasto.cartao, depois ? alvo.nextSibling : alvo);
  });
  const soltar = (ev) => { if (!arrasto || ev.pointerId !== arrasto.id) return; arrasto.cartao.classList.remove("arrastando"); arrasto = null; };
  tela.addEventListener("pointerup", soltar);
  tela.addEventListener("pointercancel", soltar);
  tela.addEventListener("click", (ev) => { if (ev.target.closest(".organizando [data-equipe]")) ev.preventDefault(); }, true);

  async function salvarOrdem(c, ids, botao) {
    // Reordena só as linhas desta competição na aba EQUIPES, mantendo as demais onde estão.
    const aplicar = (pacote) => {
      const linhas = (pacote.abas || {})["EQUIPES"] || [];
      const comp = (l) => DIMAS.slug(l["Competição"] || l["Competições"] || "") === c.id;
      const idDe = (l) => c.id + "--" + DIMAS.slug(l.Time || l.Equipe || "");
      const posicoes = [], dela = [];
      linhas.forEach((l, i) => { if (comp(l)) { posicoes.push(i); dela.push(l); } });
      const peso = (l) => { const p = ids.indexOf(idDe(l)); return p < 0 ? ids.length : p; };
      const ordenadas = dela.slice().sort((a, b) => peso(a) - peso(b));
      posicoes.forEach((p, k) => { linhas[p] = ordenadas[k]; });
      return dela.length > 0;
    };
    botao.disabled = true;
    try {
      const publicado = await DIMAS.lerDoc("publicado", true);
      if (!aplicar(publicado)) throw new Error("competição não encontrada na base");
      publicado.publicadoEm = new Date().toISOString();
      await DIMAS.gravarDoc("publicado", publicado);
      try { const rascunho = await DIMAS.lerDoc("rascunho", true); if (aplicar(rascunho)) await DIMAS.gravarDoc("rascunho", rascunho); } catch (e) {}
      DIMAS.guarda.gravar(DIMAS.CHAVES.dados, JSON.stringify(publicado));
      dados = DIMAS.normalizar(publicado);
      aviso("Nova ordem dos clubes publicada.");
    } catch (e) {
      aviso(e.message === "Failed to fetch" ? "Sem internet. A nova ordem não foi salva." : "Não foi possível salvar a ordem: " + e.message);
      redesenhar();
    } finally { botao.disabled = false; }
  }

  function numeros(lista) {
    const media = (v) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0);
    const idade = media(lista.map((a) => a.idade).filter(Boolean));
    const alt = media(lista.map((a) => a.estaturaCm).filter(Boolean));
    const canhotos = lista.filter((a) => chave(a.pe) === "canhoto").length;
    const item = (v, r) => "<div><b>" + v + "</b><span>" + r + "</span></div>";
    return '<div class="numeros">' + item(lista.length, "Atletas") + item(idade ? idade.toFixed(1).replace(".", ",") : "—", "Idade média") +
      item(alt ? (alt / 100).toFixed(2).replace(".", ",") : "—", "Altura média") + item(canhotos, "Canhotos") + "</div>";
  }

  function htmlElenco(equipe, lista, atletaId) {
    const grupos = [];
    for (const a of lista) {
      if (estado.filtro && a.funcao !== estado.filtro) continue;
      let g = grupos.find((x) => x.nome === a.funcao);
      if (!g) grupos.push((g = { nome: a.funcao, itens: [] }));
      g.itens.push(a);
    }
    return grupos.map((g) => '<h3 class="secao">' + esc(g.nome) + "<span>" + g.itens.length + '</span></h3><div class="lista">' + g.itens.map((a) => {
      const marcas = (a.video ? IC_VIDEO : "") + (a.analise || a.forte || a.vulneravel ? IC_TEXTO : "");
      return '<a class="atleta" href="#/e/' + encodeURIComponent(equipe.id) + "/" + encodeURIComponent(a.id) + '"' + (a.id === atletaId ? ' aria-current="true"' : "") + ">" +
        avatar(a, 120) + '<span class="txt"><b>' + esc(a.nome) + "</b><span>" + esc(linhaAtleta(a)) + "</span></span>" +
        (marcas ? '<span class="marcas">' + marcas + "</span>" : "") + SETA + "</a>";
    }).join("") + "</div>").join("");
  }

  function htmlFicha(equipe, lista, a) {
    if (!a) {
      return '<div class="escolha"><div><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg><p>' +
        (lista.length ? "Selecione um atleta para ver a ficha." : "O elenco desta equipe ainda não foi cadastrado.") + "</p></div></div>";
    }
    const i = lista.indexOf(a), ant = lista[i - 1], prox = lista[i + 1];
    const itens = (t) => t.split(/\n|;/).map((x) => x.replace(/^[\s\-•·]+/, "").trim()).filter(Boolean);
    const bloco = (titulo, texto, classe) => {
      if (!texto) return "";
      const li = itens(texto);
      return '<section class="bloco ' + (classe || "") + '"><h3>' + titulo + "</h3>" + (classe && li.length > 1 ? "<ul>" + li.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>" : "<p>" + esc(texto) + "</p>") + "</section>";
    };
    const v = midia(a.video);
    let video = "";
    if (v && v.embed) video = '<section class="bloco"><h3>Vídeo</h3><div class="video"><button data-tocar="' + esc(v.embed) + '"><i><svg viewBox="0 0 24 24"><path d="M7 4.500v15l12-7.500z"/></svg></i>Assistir vídeo</button></div></section>';
    else if (v) video = '<section class="bloco"><h3>Vídeo</h3><div class="video-vazio"><a class="botao" target="_blank" rel="noopener" href="' + esc(v.externo) + '">' + IC_VIDEO + "Abrir vídeo</a></div></section>";
    else video = '<section class="bloco"><h3>Vídeo</h3><div class="video-vazio"><span>Nenhum vídeo cadastrado.</span>' + (ehAdmin() ? '<button class="botao contorno" data-editar="Video">' + IC_VIDEO + "Adicionar vídeo</button>" : "") + "</div></section>";
    estado.atleta = a; estado.equipe = equipe;
    const ogol = midia(a.ogol);
    const textos = bloco("Características individuais", a.analise) + bloco("Pontos fortes", a.forte, "forte") + bloco("Pontos vulneráveis", a.vulneravel, "fraco");
    const conteudo = video + (textos || '<div class="sem-analise">Análise individual ainda não cadastrada.' + (ehAdmin() ? ' <button class="link" data-editar="Análise Individual">Cadastrar agora</button>' : "") + "</div>");
    const passo = (x, rotulo) => x ? '<a class="botao contorno" href="#/e/' + encodeURIComponent(equipe.id) + "/" + encodeURIComponent(x.id) + '" aria-label="' + rotulo + ": " + esc(x.nome) + '"><span>' + (rotulo === "Anterior" ? "‹ " : "") + esc(x.nome) + (rotulo === "Próximo" ? " ›" : "") + "</span></a>" : '<span class="botao contorno" style="visibility:hidden"></span>';
    const dado = (r, val) => "<div><span>" + r + "</span><b>" + esc(val || "—") + "</b></div>";
    return '<div class="ficha-topo">' + avatar(a, 400) + '<h2 class="titulo">' + esc(a.nome) + '</h2><span class="etiqueta">' + esc(a.funcao) + "</span><p>" + esc(equipe.nome) + "</p>" + (ehAdmin() ? '<button class="botao contorno editar-atleta" data-editar="Atleta">' + IC_LAPIS + "Editar atleta</button>" : "") + "</div>" +
      '<div class="tres">' + dado("Idade", a.idade ? a.idade + " anos" : "") + dado("Estatura", a.estatura) + dado("Pé dominante", a.pe) + "</div>" +
      conteudo +
      (ogol ? '<a class="botao contorno" style="margin-top:12px;width:100%;justify-content:center" target="_blank" rel="noopener" href="' + esc(ogol.externo) + '">' + IC_LINK + "Histórico no oGol</a>" : "") +
      '<div class="passos">' + passo(ant, "Anterior") + passo(prox, "Próximo") + "</div>";
  }

  function telaEquipe(equipeId, atletaId) {
    const equipe = dados.equipes.find((e) => e.id === equipeId);
    if (!equipe) return telaInicio();
    const lista = atletasDa(equipe);
    const a = lista.find((x) => x.id === atletaId) || null;

    if (estado.equipeNaTela === equipeId && $(".equipe")) {
      // mesma equipe: troca só a ficha, preservando a rolagem do elenco
      $(".equipe").classList.toggle("com-atleta", !!a);
      $(".col-ficha").innerHTML = htmlFicha(equipe, lista, a);
      $(".col-ficha").scrollTop = 0;
      tela.querySelectorAll(".atleta").forEach((el) => el.toggleAttribute("aria-current", !!a && el.getAttribute("href").endsWith("/" + encodeURIComponent(a.id))));
      tela.querySelectorAll('.atleta[aria-current]').forEach((el) => el.setAttribute("aria-current", "true"));
      if (a && window.matchMedia("(max-width: 899px)").matches) window.scrollTo(0, 0);
      return;
    }
    estado.equipeNaTela = equipeId; estado.filtro = "";
    const rel = midia(equipe.relatorio), pre = midia(equipe.preJogo);
    const acao = (m, rotulo, icone, principal) => !m ? "" : m.embed
      ? '<button class="botao' + (principal ? "" : " contorno") + '" data-abrir="' + esc(m.embed) + '" data-externo="' + esc(m.externo) + '" data-titulo="' + esc(rotulo + " — " + equipe.nome) + '">' + icone + rotulo + "</button>"
      : '<a class="botao' + (principal ? "" : " contorno") + '" target="_blank" rel="noopener" href="' + esc(m.externo) + '">' + icone + rotulo + "</a>";
    const funcoes = [...new Set(lista.map((x) => x.funcao))];
    const filtros = funcoes.length > 1 ? '<div class="filtros" role="group" aria-label="Filtrar por função"><button class="chip" aria-pressed="true" data-filtro="">Todos</button>' +
      funcoes.map((f) => '<button class="chip" aria-pressed="false" data-filtro="' + esc(f) + '">' + esc(f) + "</button>").join("") + "</div>" : "";
    tela.innerHTML = '<div class="equipe' + (a ? " com-atleta" : "") + '"><section class="col-lista">' +
      '<div class="heroi"><span class="escudo">' + arte(equipe.imagem, equipe.nome, 300) + '</span><h1 class="titulo">' + esc(equipe.nome) + "</h1><p>" + esc(equipe.competicao) + "</p></div>" +
      (rel || pre ? '<div class="acoes">' + acao(rel, "Relatório do adversário", IC_DOC, true) + acao(pre, "Análise do adversário", IC_VIDEO, !rel) + "</div>" : "") +
      (lista.length ? numeros(lista) + filtros + '<div id="elenco">' + htmlElenco(equipe, lista, atletaId) + "</div>" : '<div class="vazio so-celular">O elenco desta equipe ainda não foi cadastrado.</div>') +
      '</section><section class="col-ficha">' + htmlFicha(equipe, lista, a) + "</section></div>";
    window.scrollTo(0, 0);
  }

  /* ---------- rotas ---------- */
  function rota() {
    if (document.body.classList.contains("bloqueado")) return; // nada é desenhado antes do login
    const partes = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
    const voltar = $("#voltar");
    fecharCamadas();
    if (partes[0] === "c" && partes[1]) {
      estado.equipeNaTela = ""; telaCompeticao(partes[1]); voltar.hidden = false; voltar.href = "#/";
    } else if (partes[0] === "e" && partes[1]) {
      telaEquipe(partes[1], partes[2] || "");
      const eq = dados.equipes.find((e) => e.id === partes[1]);
      const estreito = window.matchMedia("(max-width: 899px)").matches;
      voltar.hidden = false;
      voltar.href = partes[2] && estreito ? "#/e/" + encodeURIComponent(partes[1]) : eq ? "#/c/" + encodeURIComponent(eq.competicaoId) : "#/";
    } else {
      estado.equipeNaTela = ""; telaInicio(); voltar.hidden = true;
    }
    if (partes[0] !== "e") window.scrollTo(0, 0);
  }
  function redesenhar() { estado.equipeNaTela = ""; rota(); }

  /* ---------- camadas: mídia e busca ---------- */
  function abrirJanela(embed, externo, titulo) {
    $("#janela-titulo").textContent = titulo; $("#janela-externo").href = externo || embed;
    $("#janela-quadro").src = embed; $("#janela").classList.add("aberta");
  }
  function fecharCamadas() {
    document.querySelectorAll(".camada.aberta").forEach((c) => c.classList.remove("aberta"));
    $("#janela-quadro").src = "about:blank";
  }
  function buscar(termo) {
    const t = chave(termo), caixa = $("#resultados");
    if (t.length < 2) { caixa.innerHTML = '<p class="suave" style="text-align:center;margin-top:32px">Digite ao menos 2 letras.</p>'; return; }
    const equipes = dados.equipes.filter((e) => chave(e.nome).includes(t)).slice(0, 8);
    const atletas = dados.atletas.filter((a) => chave(a.nome).includes(t) || chave(a.funcao) === t).slice(0, 40);
    const linhaE = (e) => '<a class="atleta" href="#/e/' + encodeURIComponent(e.id) + '"><span class="avatar" style="border-radius:8px;background:none">' + arte(e.imagem, e.nome, 120) + '</span><span class="txt"><b>' + esc(e.nome) + "</b><span>" + esc(e.competicao) + "</span></span>" + SETA + "</a>";
    const linhaA = (a) => {
      const e = dados.equipes.find((x) => x.elencoChave === a.equipeChave);
      return e ? '<a class="atleta" href="#/e/' + encodeURIComponent(e.id) + "/" + encodeURIComponent(a.id) + '">' + avatar(a, 120) + '<span class="txt"><b>' + esc(a.nome) + "</b><span>" + esc(a.funcao + " · " + a.equipe) + "</span></span>" + SETA + "</a>" : "";
    };
    caixa.innerHTML = (equipes.length ? '<h3 class="secao">Equipes</h3><div class="lista">' + equipes.map(linhaE).join("") + "</div>" : "") +
      (atletas.length ? '<h3 class="secao">Atletas</h3><div class="lista">' + atletas.map(linhaA).join("") + "</div>" : "") ||
      '<p class="suave" style="text-align:center;margin-top:32px">Nada encontrado para “' + esc(termo) + "”.</p>";
  }

  /* ---------- atualização ---------- */
  let avisoT;
  function aviso(msg) {
    const el = $("#aviso"); el.textContent = msg; el.classList.add("visivel");
    clearTimeout(avisoT); avisoT = setTimeout(() => el.classList.remove("visivel"), 3200);
  }
  let ultimaChecagem = 0;
  async function atualizar(manual) {
    const botao = $("#atualizar");
    if (!DIMAS.conectado()) { if (manual) aviso("Base online ainda não conectada. Mostrando os dados deste aparelho."); return; }
    botao.classList.add("girando");
    const semDados = !dados.competicoes.length;
    if (semDados) { estado.carregando = true; redesenhar(); }
    try {
      const antes = dados.publicadoEm;
      const novo = DIMAS.normalizar(await DIMAS.buscarPublicado());
      ultimaChecagem = Date.now();
      if (novo.publicadoEm !== antes) { dados = novo; redesenhar(); aviso("Dados atualizados."); }
      else if (manual) aviso("Você já está com a versão mais recente.");
    } catch (e) {
      if (manual) aviso(navigator.onLine === false ? "Sem internet. Mostrando os dados salvos." : "Não foi possível atualizar agora.");
      if (e.codigo === "PERMISSION_DENIED") aviso("Seu acesso não está liberado. Fale com o DIMAS.");
      else if (semDados) aviso(navigator.onLine === false ? "Sem internet. Conecte-se para baixar os dados." : "Não foi possível baixar os dados. Toque em atualizar para tentar de novo.");
    } finally { botao.classList.remove("girando"); if (estado.carregando) { estado.carregando = false; redesenhar(); } }
  }

  /* ---------- fotos importadas (guardadas na base, um documento por elenco) ---------- */
  const fotosPorElenco = {};
  function pintarFotos() {
    const pendentes = [...document.querySelectorAll("img[data-foto][hidden]")];
    for (const doc of new Set(pendentes.map((i) => i.dataset.doc))) {
      if (!doc) continue;
      if (!fotosPorElenco[doc]) fotosPorElenco[doc] = DIMAS.lerDoc(doc, true).then((d) => (d && d.fotos) || {}).catch(() => { delete fotosPorElenco[doc]; return {}; });
      fotosPorElenco[doc].then((fotos) => {
        document.querySelectorAll("img[data-foto][hidden]").forEach((img) => {
          if (img.dataset.doc !== doc || !fotos[img.dataset.foto]) return;
          img.src = fotos[img.dataset.foto]; img.hidden = false;
          const prox = img.nextElementSibling; if (prox && prox.classList.contains("sigla")) prox.remove();
        });
      });
    }
  }
  let fotosT; const observarFotos = new MutationObserver(() => { clearTimeout(fotosT); fotosT = setTimeout(pintarFotos, 60); });
  observarFotos.observe(tela, { childList: true, subtree: true }); observarFotos.observe($("#resultados"), { childList: true, subtree: true });

  /* ---------- edição do atleta (só administradores) ---------- */
  const CAMPOS_EDICAO = [
    ["Atleta", "Nome", "texto"], ["Função", "Função", "funcao"], ["Pé dominante", "Pé dominante", "pe"], ["Nascimento", "Nascimento (dd/mm/aaaa)", "texto"],
    ["Estatura", "Estatura (cm)", "texto"], ["Imagem", "Foto (link do Google Drive ou endereço da imagem)", "texto", "larga"],
    ["Video", "Vídeo (link do YouTube ou do Google Drive)", "texto", "larga"], ["Histórico (site oGol)", "Histórico no oGol (link)", "texto", "larga"],
    ["Análise Individual", "Características individuais", "area", "larga"], ["Ponto forte", "Pontos fortes (um por linha)", "area"], ["Ponto vulnerável", "Pontos vulneráveis (um por linha)", "area"],
  ];
  const acharLinha = (pacote, a) => ((pacote.abas || {})["ADVERSÁRIOS"] || []).find((l) => chave(l["Adversário"]) === a.equipeChave && chave(l.Atleta) === chave(a.nome));
  function abrirEditor(foco) {
    const a = estado.atleta, equipe = estado.equipe;
    if (!a || !ehAdmin()) return;
    const atual = acharLinha(DIMAS.pacoteLocal(), a) || {};
    let caixa = $("#editor");
    if (!caixa) { caixa = document.createElement("dialog"); caixa.id = "editor"; caixa.className = "editor"; document.body.appendChild(caixa); }
    const opcoes = (lista, v) => (v && !lista.some((x) => chave(x) === chave(v)) ? [v] : []).concat(lista).map((x) => "<option" + (chave(x) === chave(v) ? " selected" : "") + ">" + esc(x) + "</option>").join("");
    const campo = ([nome, rotulo, tipo, classe], k) => {
      const v = atual[nome] || "", id = "ed" + k;
      let entrada;
      if (tipo === "area") entrada = '<textarea id="' + id + '" data-campo="' + esc(nome) + '" rows="4">' + esc(v) + "</textarea>";
      else if (tipo === "funcao") entrada = '<select id="' + id + '" data-campo="' + esc(nome) + '"><option value="">—</option>' + opcoes(DIMAS.FUNCOES, v === "Sem função" ? "" : v) + "</select>";
      else if (tipo === "pe") entrada = '<select id="' + id + '" data-campo="' + esc(nome) + '"><option value="">—</option>' + opcoes(["Destro", "Canhoto", "Ambidestro"], v) + "</select>";
      else entrada = '<input type="text" id="' + id + '" data-campo="' + esc(nome) + '" value="' + esc(v) + '" autocomplete="off">';
      return '<div class="' + (classe || "") + '"><label for="' + id + '">' + esc(rotulo) + "</label>" + entrada + "</div>";
    };
    caixa.innerHTML = '<form method="dialog" id="form-editor"><h2 class="titulo">Editar atleta</h2><p class="suave">' + esc(equipe.nome + " · " + equipe.competicao) + '</p><div class="editor-grade">' + CAMPOS_EDICAO.map(campo).join("") +
      '</div><p class="entrada-erro" id="editor-erro" role="alert"></p><div class="editor-rodape"><button type="button" class="botao contorno" id="editor-cancelar">Cancelar</button><button type="submit" class="botao" id="editor-salvar">Salvar e publicar</button></div></form>';
    $("#editor-cancelar").onclick = () => caixa.close();
    $("#form-editor").onsubmit = (ev) => { ev.preventDefault(); salvarEdicao(a, equipe); };
    caixa.showModal();
    const alvo = foco && caixa.querySelector('[data-campo="' + foco + '"]');
    if (alvo) { alvo.focus(); alvo.scrollIntoView({ block: "center" }); }
  }
  async function salvarEdicao(a, equipe) {
    const erro = $("#editor-erro"), botao = $("#editor-salvar"), novos = {};
    document.querySelectorAll("#form-editor [data-campo]").forEach((el) => { novos[el.dataset.campo] = el.value.trim(); });
    if (!novos.Atleta) { erro.textContent = "Informe o nome."; return; }
    if (novos.Nascimento && !DIMAS.idadeDe(novos.Nascimento)) { erro.textContent = "Nascimento deve estar no formato dd/mm/aaaa."; return; }
    if (novos.Video && !midia(novos.Video)) { erro.textContent = "O link do vídeo não parece válido. Use um link do YouTube ou do Google Drive."; return; }
    if (novos.Nascimento) novos.Idade = DIMAS.idadeDe(novos.Nascimento) + " Anos";
    novos.Ordem = String(DIMAS.ordemDa(novos["Função"]));
    const aplicar = (pacote) => { const l = acharLinha(pacote, a); if (!l) return false; Object.assign(l, novos); return true; };
    erro.textContent = ""; botao.disabled = true; botao.textContent = "Salvando…";
    try {
      const publicado = await DIMAS.lerDoc("publicado", true); // parte sempre da versão mais recente
      if (!aplicar(publicado)) throw new Error("Este atleta não está mais na base. Atualize o app e tente de novo.");
      publicado.publicadoEm = new Date().toISOString();
      await DIMAS.gravarDoc("publicado", publicado);
      try { const rascunho = await DIMAS.lerDoc("rascunho", true); if (aplicar(rascunho)) await DIMAS.gravarDoc("rascunho", rascunho); } catch (e) {} // mantém o painel em dia
      DIMAS.guarda.gravar(DIMAS.CHAVES.dados, JSON.stringify(publicado));
      dados = DIMAS.normalizar(publicado);
      $("#editor").close();
      const novoId = DIMAS.slug(a.equipe) + "--" + DIMAS.slug(novos.Atleta);
      estado.equipeNaTela = "";
      const destino = "#/e/" + encodeURIComponent(equipe.id) + "/" + encodeURIComponent(novoId);
      if (location.hash === destino) rota(); else location.hash = destino;
      aviso("Atleta atualizado e publicado.");
    } catch (e) {
      erro.textContent = e.message === "Failed to fetch" ? "Sem internet. A edição não foi salva." : "Não foi possível salvar: " + e.message;
    } finally { botao.disabled = false; botao.textContent = "Salvar e publicar"; }
  }

  /* ---------- eventos ---------- */
  document.addEventListener("click", (ev) => {
    const el = ev.target.closest("[data-abrir],[data-tocar],[data-filtro],[data-fechar],[data-editar]");
    if (!el) return;
    if (el.dataset.editar) { abrirEditor(el.dataset.editar); return; }
    if (el.dataset.abrir) abrirJanela(el.dataset.abrir, el.dataset.externo, el.dataset.titulo);
    else if (el.dataset.tocar) el.parentElement.innerHTML = '<iframe src="' + esc(el.dataset.tocar) + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
    else if (el.hasAttribute("data-fechar")) fecharCamadas();
    else if (el.hasAttribute("data-filtro")) {
      estado.filtro = el.dataset.filtro;
      tela.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c === el)));
      const partes = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
      const equipe = dados.equipes.find((e) => e.id === partes[1]);
      if (equipe) $("#elenco").innerHTML = htmlElenco(equipe, atletasDa(equipe), partes[2] || "");
    }
  });
  $("#abrir-busca").addEventListener("click", () => { $("#busca").classList.add("aberta"); const c = $("#campo-busca"); c.value = ""; buscar(""); c.focus(); });
  $("#campo-busca").addEventListener("input", (e) => buscar(e.target.value));
  $("#atualizar").addEventListener("click", () => atualizar(true));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") fecharCamadas(); });
  window.addEventListener("hashchange", rota);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && Date.now() - ultimaChecagem > 5 * 60 * 1000) atualizar(false); });
  let larguraEstreita = window.matchMedia("(max-width: 899px)");
  larguraEstreita.addEventListener("change", rota);

  /* ---------- abertura (3 s) e login ---------- */
  function abrirApp() {
    document.body.classList.remove("bloqueado");
    $("#entrada").hidden = true;
    $("#sair").hidden = !(DIMAS.conectado() && DIMAS.sessao());
    rota();
    atualizar(false);
  }
  function pedirLogin() {
    $("#entrada").hidden = false;
    setTimeout(() => $("#entrada-email").focus(), 50);
  }
  $("#form-entrada").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const email = $("#entrada-email").value.trim(), senha = $("#entrada-senha").value, erro = $("#entrada-erro"), botao = $("#entrada-botao");
    if (!email || !senha) { erro.textContent = "Informe o e-mail e a senha."; return; }
    erro.textContent = ""; botao.disabled = true; botao.textContent = "Entrando…";
    try { await DIMAS.entrar(email, senha); $("#entrada-senha").value = ""; abrirApp(); }
    catch (e) { erro.textContent = e.message === "Failed to fetch" ? "Sem internet. Conecte-se para entrar pela primeira vez." : e.message; }
    finally { botao.disabled = false; botao.textContent = "Entrar"; }
  });
  $("#esqueci").addEventListener("click", async () => {
  const email = $("#entrada-email").value.trim(), erro = $("#entrada-erro");
  if (!email) { erro.textContent = "Digite seu e-mail acima para receber o link de nova senha."; return; }
  try { await DIMAS.enviarDefinicaoSenha(email); erro.textContent = ""; aviso("Se o e-mail tiver acesso, você vai receber um link para criar a senha."); }
  catch (e) { erro.textContent = "Não foi possível enviar: " + e.message; }
});
$("#sair").addEventListener("click", async () => {
    if (!(await DIMAS.confirmar("Sair da conta neste aparelho?", "Sair"))) return;
    DIMAS.sair(); document.body.classList.add("bloqueado"); tela.innerHTML = ""; $("#sair").hidden = true; pedirLogin();
  });
  (function abertura() {
    const DURACAO = 3000, inicio = performance.now(), barra = $("#abertura-progresso"), pct = $("#abertura-pct"), caixa = $("#abertura");
    const suave = (t) => 1 - Math.pow(1 - t, 2.2);
    function passo(agora) {
      const t = Math.min(1, (agora - inicio) / DURACAO), v = Math.round(suave(t) * 100);
      barra.style.width = v + "%"; pct.textContent = v + "%";
      if (t < 1) return requestAnimationFrame(passo);
      caixa.classList.add("saindo");
      setTimeout(() => { caixa.remove(); (!DIMAS.conectado() || DIMAS.sessao()) ? abrirApp() : pedirLogin(); }, 350);
    }
    requestAnimationFrame(passo);
  })();
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    // Quando sai uma versão nova do app, o aparelho troca sozinho e recarrega uma vez.
    const tinhaVersao = !!navigator.serviceWorker.controller; let recarregou = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (tinhaVersao && !recarregou) { recarregou = true; location.reload(); } });
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then((reg) => {
      document.addEventListener("visibilitychange", () => { if (!document.hidden) reg.update().catch(() => {}); });
    }).catch(() => {});
  }
})();

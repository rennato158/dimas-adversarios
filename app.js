/* DIMAS Adversários — app de visualização (celular e iPad). */
(function () {
  const { esc, imagem, midia, chave, dataHora } = DIMAS;
  const $ = (s, r) => (r || document).querySelector(s);
  const tela = $("#tela");
  let dados = DIMAS.normalizar(DIMAS.pacoteLocal());
  const estado = { equipeNaTela: "", filtro: "", atleta: null, equipe: null };
  const ehAdmin = () => { const s = DIMAS.sessao(); const lista = ((window.DIMAS_CONFIG || {}).ADMINS || []).map((x) => String(x).toLowerCase()); return !!s && lista.includes(String(s.email || "").toLowerCase()); };
  const IC_LAPIS = '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/></svg>';
  const IC_BUSCA_G = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
  const IC_COLAR = '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6"/></svg>';
  const IC_ARQUIVO = '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg>';
  const IC_CORTE = '<svg viewBox="0 0 24 24"><path d="M6 2v14a2 2 0 0 0 2 2h14M2 6h14a2 2 0 0 1 2 2v14"/></svg>';
  const IC_MAIS = '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>';
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
    tela.innerHTML = '<div class="cabecalho"><h1 class="titulo">Competições</h1>' + (ehAdmin() ? '<button type="button" class="botao contorno mini" data-acao="incluir-competicao">' + IC_MAIS + "Incluir competição</button>" : "") + "</div>" +
      (cartoes ? '<div class="grade">' + cartoes + "</div>" : '<div class="vazio">' + (estado.carregando ? "Carregando dados…" : "Nenhuma competição cadastrada ainda.") + "</div>");
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
    const admin = ehAdmin() ? '<div class="acoes-admin"><button type="button" class="botao contorno mini" data-acao="incluir-equipe" data-id="' + esc(c.id) + '">' + IC_MAIS + "Incluir equipe</button>" +
      '<button type="button" class="botao contorno mini" data-acao="editar-competicao" data-id="' + esc(c.id) + '">' + IC_LAPIS + "Editar competição</button></div>" : "";
    tela.innerHTML = '<div class="cabecalho"><h1 class="titulo">' + esc(c.nome) + '</h1><div class="cabecalho-lado"><small>' + plural(equipes.length, "equipe", "equipes") + "</small>" + organizar + "</div></div>" + admin +
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
      try { const rascunho = await DIMAS.lerDoc("rascunho", true); if (aplicar(rascunho) === true) await DIMAS.gravarDoc("rascunho", rascunho); } catch (e) {}
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
    const sub23 = lista.filter((a) => a.idade && a.idade < 23).length; // atletas com até 22 anos
    const item = (v, r) => "<div><b>" + v + "</b><span>" + r + "</span></div>";
    return '<div class="numeros">' + item(lista.length, "Atletas") + item(idade ? idade.toFixed(1).replace(".", ",") : "—", "Idade média") +
      item(alt ? (alt / 100).toFixed(2).replace(".", ",") : "—", "Altura média") + item(sub23, "Sub-23") + "</div>";
  }

  // Título da seção no plural: Goleiros, Laterais, Zagueiros, Volantes, Meias, Extremos, Atacantes…
  const plural_funcao = (f) => /^sem /i.test(f) ? f : /al$/i.test(f) ? f.slice(0, -2) + "ais" : /or$/i.test(f) ? f + "es" : /[aeiou]$/i.test(f) ? f + "s" : f;
  function htmlElenco(equipe, lista, atletaId) {
    const grupos = [];
    for (const a of lista) {
      if (estado.filtro && a.funcao !== estado.filtro) continue;
      let g = grupos.find((x) => x.nome === a.funcao);
      if (!g) grupos.push((g = { nome: a.funcao, itens: [] }));
      g.itens.push(a);
    }
    return grupos.map((g) => '<h3 class="secao">' + esc(plural_funcao(g.nome)) + "<span>" + g.itens.length + '</span></h3><div class="lista">' + g.itens.map((a) => {
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
    const itens = (t) => t.split(/\n|;/).map((x) => x.replace(/^[\s\-•·]+/, "").trim()).filter(Boolean);
    const bloco = (titulo, texto, classe) => {
      if (!texto) return "";
      const li = itens(texto);
      return '<section class="bloco ' + (classe || "") + '"><h3>' + titulo + "</h3>" + (classe ? '<ul class="topicos">' + li.map((x) => "<li>" + esc(x.charAt(0).toUpperCase() + x.slice(1).replace(/\.$/, "")) + "</li>").join("") + "</ul>" : "<p>" + esc(texto) + "</p>") + "</section>";
    };
    const v = midia(a.video);
    let video = "";
    if (v && v.embed) video = '<section class="bloco"><h3>Vídeo</h3><div class="video"><button data-tocar="' + esc(v.embed) + '"><i><svg viewBox="0 0 24 24"><path d="M7 4.500v15l12-7.500z"/></svg></i>Assistir vídeo</button></div></section>';
    else if (v) video = '<section class="bloco"><h3>Vídeo</h3><div class="video-vazio"><a class="botao" target="_blank" rel="noopener" href="' + esc(v.externo) + '">' + IC_VIDEO + "Abrir vídeo</a></div></section>";
    else video = '<section class="bloco"><h3>Vídeo</h3><div class="video-vazio"><span>Nenhum vídeo cadastrado.</span>' + (ehAdmin() ? '<button class="botao contorno" data-editar="Video">' + IC_VIDEO + "Adicionar vídeo</button>" : "") + "</div></section>";
    estado.atleta = a; estado.equipe = equipe;
    const ogol = midia(a.ogol);
    const pontos = bloco("Pontos fortes", a.forte, "forte") + bloco("Pontos vulneráveis", a.vulneravel, "fraco");
    const textos = bloco("Características individuais", a.analise) + (pontos ? '<div class="pontos">' + pontos + "</div>" : "");
    const conteudo = video + (textos || '<div class="sem-analise">Análise individual ainda não cadastrada.' + (ehAdmin() ? ' <button class="link" data-editar="Análise Individual">Cadastrar agora</button>' : "") + "</div>");
    const dado = (r, val) => "<div><span>" + r + "</span><b>" + esc(val || "—") + "</b></div>";
    const acoes = (ogol ? '<a class="botao contorno mini" target="_blank" rel="noopener" href="' + esc(ogol.externo) + '">' + IC_LINK + "Histórico</a>" : "") +
      (ehAdmin() ? '<button class="botao contorno mini editar-atleta" data-editar="Atleta" title="Editar atleta">' + IC_LAPIS + "Editar</button>" : "");
    return '<div class="ficha-topo">' + avatar(a, 400) + '<div class="ficha-id"><h2 class="titulo">' + esc(a.nome) + '</h2><p><span class="etiqueta">' + esc(a.funcao) + "</span><span>" + esc(equipe.nome) + "</span></p>" +
      (acoes ? '<div class="ficha-acoes">' + acoes + "</div>" : "") + "</div></div>" +
      '<div class="tres">' + dado("Idade", a.idade ? a.idade + " anos" : "") + dado("Estatura", a.estatura) + dado("Pé dominante", a.pe) + "</div>" +
      conteudo;
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
    const filtros = funcoes.length > 1 ? '<label class="filtro-funcao"><span>Função</span><select id="filtro-funcao" aria-label="Filtrar por função"><option value="">Todas as funções</option>' +
      funcoes.map((f) => '<option value="' + esc(f) + '">' + esc(f) + "</option>").join("") + "</select></label>" : "";
    tela.innerHTML = '<div class="equipe' + (a ? " com-atleta" : "") + '"><section class="col-lista">' +
      '<div class="heroi"><span class="escudo">' + arte(equipe.imagem, equipe.nome, 300) + '</span><h1 class="titulo">' + esc(equipe.nome) + "</h1><p>" + esc(equipe.competicao) + "</p>" + (ehAdmin() ? '<button type="button" class="botao contorno mini" data-acao="editar-equipe" data-id="' + esc(equipe.id) + '">' + IC_LAPIS + "Editar equipe</button>" : "") + "</div>" +
      (rel || pre ? '<div class="acoes">' + acao(rel, "Relatório do adversário", IC_DOC, true) + acao(pre, "Análise do adversário", IC_VIDEO, !rel) + "</div>" : "") +
      (lista.length ? numeros(lista) : "") +
      ((filtros || ehAdmin()) ? '<div class="linha-elenco">' + filtros + (ehAdmin() ? '<button type="button" class="botao contorno mini incluir-atleta" data-incluir="' + esc(equipe.id) + '">' + IC_MAIS + "Incluir atleta</button>" : "") + "</div>" : "") +
      (lista.length ? '<div id="elenco">' + htmlElenco(equipe, lista, atletaId) + "</div>" : '<div class="vazio so-celular">O elenco desta equipe ainda não foi cadastrado.</div>') +
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
    ["Estatura", "Estatura (cm)", "texto"], ["Imagem", "Foto do atleta", "foto", "larga"],
    ["Video", "Vídeo (link do YouTube ou do Google Drive)", "texto", "larga"], ["Histórico (site oGol)", "Histórico no oGol (link)", "texto", "larga"],
    ["Análise Individual", "Características individuais", "area", "larga"], ["Ponto forte", "Pontos fortes (um por linha)", "area"], ["Ponto vulnerável", "Pontos vulneráveis (um por linha)", "area"],
  ];
  const acharLinha = (pacote, a) => ((pacote.abas || {})["ADVERSÁRIOS"] || []).find((l) => chave(l["Adversário"]) === a.equipeChave && chave(l.Atleta) === chave(a.nome));
  function abrirEditor(foco) {
    const a = estado.atleta, equipe = estado.equipe;
    if (!a || !ehAdmin()) return;
    const atual = a.novo ? { "Adversário": a.equipe } : acharLinha(DIMAS.pacoteLocal(), a) || {};
    let caixa = $("#editor");
    if (!caixa) { caixa = document.createElement("dialog"); caixa.id = "editor"; caixa.className = "editor"; document.body.appendChild(caixa); }
    const opcoes = (lista, v) => (v && !lista.some((x) => chave(x) === chave(v)) ? [v] : []).concat(lista).map((x) => "<option" + (chave(x) === chave(v) ? " selected" : "") + ">" + esc(x) + "</option>").join("");
    const campo = ([nome, rotulo, tipo, classe], k) => {
      const v = atual[nome] || "", id = "ed" + k;
      let entrada;
      if (tipo === "area") entrada = '<textarea id="' + id + '" data-campo="' + esc(nome) + '" rows="4">' + esc(v) + "</textarea>";
      else if (tipo === "funcao") entrada = '<select id="' + id + '" data-campo="' + esc(nome) + '"><option value="">—</option>' + opcoes(DIMAS.FUNCOES, v === "Sem função" ? "" : v) + "</select>";
      else if (tipo === "pe") entrada = '<select id="' + id + '" data-campo="' + esc(nome) + '"><option value="">—</option>' + opcoes(["Destro", "Canhoto", "Ambidestro"], v) + "</select>";
      else if (tipo === "foto") entrada = campoImagemHtml({ id, nome, valor: v, doc: "fotos-" + DIMAS.slug(a.equipe), prefixo: "foto:", sigla: iniciais(a.nome || "?") });
      else entrada = '<input type="text" id="' + id + '" data-campo="' + esc(nome) + '" value="' + esc(v) + '" autocomplete="off">';
      return '<div class="' + (classe || "") + '"><label for="' + id + '">' + esc(rotulo) + "</label>" + entrada + "</div>";
    };
    caixa.innerHTML = '<form method="dialog" id="form-editor"><h2 class="titulo">' + (a.novo ? "Incluir atleta" : "Editar atleta") + '</h2><p class="suave">' + esc(equipe.nome + " · " + equipe.competicao) + '</p><div class="editor-grade">' + CAMPOS_EDICAO.map(campo).join("") +
      '</div><p class="entrada-erro" id="editor-erro" role="alert"></p><div class="editor-rodape">' + (a.novo ? "" : '<button type="button" class="botao contorno perigo" id="editor-excluir">Excluir atleta</button>') + '<button type="button" class="botao contorno" id="editor-cancelar">Cancelar</button><button type="submit" class="botao" id="editor-salvar">Salvar e publicar</button></div></form>';
    $("#editor-cancelar").onclick = () => caixa.close();
    ligarFoto(caixa, () => (caixa.querySelector('[data-campo="Atleta"]').value + " " + equipe.nome + " jogador"));
    if ($("#editor-excluir")) $("#editor-excluir").onclick = () => excluirAtleta(a, equipe);
    $("#form-editor").onsubmit = (ev) => { ev.preventDefault(); salvarEdicao(a, equipe); };
    caixa.showModal();
    pintarFotos();
    const alvo = foco && caixa.querySelector('[data-campo="' + foco + '"]');
    if (alvo) { alvo.focus(); alvo.scrollIntoView({ block: "center" }); }
  }
  /* ---------- foto do atleta no editor: link, colar, arquivo ---------- */
  const fotoEditor = { dados: "", removida: false, fonte: null, z: 1, x: 0, y: 0, modo: "foto" };
  // Campo de imagem do editor: link, colar, arquivo, Google, corte. prefixo "foto:" (atleta) ou "escudo:" (equipe/competição).
  function campoImagemHtml({ id, nome, valor, doc, prefixo, sigla }) {
    const guardada = valor && valor.startsWith(prefixo) ? valor : "";
    const previa = guardada ? '<img alt="" hidden data-foto="' + esc(guardada.slice(prefixo.length)) + '" data-doc="' + esc(doc) + '">' : (imagem(valor, 200) ? '<img alt="" src="' + esc(imagem(valor, 200)) + '">' : "");
    return '<div class="foto-editor' + (prefixo === "escudo:" ? " escudo" : "") + '"><div class="foto-previa" id="foto-previa">' + previa + "<span>" + esc(sigla) + "</span></div>" +
      '<div class="foto-campos"><input type="text" id="' + id + '" data-campo="' + esc(nome) + '" data-imagem="1" data-prefixo="' + prefixo + '" data-doc="' + esc(doc) + '" data-original="' + esc(valor || "") + '" data-guardada="' + esc(guardada) + '" value="' + esc(guardada ? "" : valor || "") + '" placeholder="' + (guardada ? "Imagem guardada. Cole um link ou uma imagem para trocar" : "Cole o link ou a imagem aqui") + '" autocomplete="off">' +
      '<div class="foto-botoes"><a class="botao contorno mini" target="_blank" rel="noopener" href="https://www.google.com/imghp">' + IC_BUSCA_G + "Buscar no Google</a>" +
      '<button type="button" class="botao contorno mini" id="foto-colar">' + IC_COLAR + "Colar imagem</button>" +
      '<button type="button" class="botao contorno mini" id="foto-arquivo-botao">' + IC_ARQUIVO + 'Arquivo</button><input type="file" accept="image/*" id="foto-arquivo" hidden>' +
      '<button type="button" class="botao contorno mini" id="foto-ajustar">' + IC_CORTE + "Ajustar corte</button>" +
      '<button type="button" class="botao contorno mini" id="foto-remover">Remover</button></div><small id="foto-aviso"></small>' +
      '<div class="foto-corte" id="foto-corte" hidden><canvas id="foto-corte-tela" width="480" height="480" aria-label="Arraste para posicionar a imagem"></canvas>' +
      '<div class="foto-corte-controles"><span>Zoom</span><input type="range" id="foto-zoom" min="1" max="4" step="0.01" value="1" aria-label="Zoom da imagem"><button type="button" class="botao mini" id="foto-corte-ok">Concluir corte</button></div></div></div></div>';
  }
  // Posição inicial: foto de atleta cobre o quadro (rosto no topo); escudo cabe inteiro no quadro.
  function posicaoInicial(centralizar) {
    const w = fotoEditor.fonte.naturalWidth, h = fotoEditor.fonte.naturalHeight;
    fotoEditor.z = fotoEditor.modo === "escudo" ? Math.min(w, h) / Math.max(w, h) : 1;
    const k = fotoEditor.z / Math.min(w, h), dw = w * k, dh = h * k; // tamanho relativo ao quadro (1 = lado)
    fotoEditor.x = (1 - dw) / 2;
    fotoEditor.y = fotoEditor.modo === "escudo" || centralizar || w >= h ? (1 - dh) / 2 : 0;
  }
  // Carrega a imagem (arquivo colado ou link). Link só serve para recorte se o site permitir cópia.
  async function carregarImagem(fonte) {
    const img = new Image();
    if (typeof fonte === "string" && !/^data:/.test(fonte)) img.crossOrigin = "anonymous";
    img.src = typeof fonte === "string" ? fonte : URL.createObjectURL(fonte);
    await img.decode();
    return img;
  }
  // Desenha o recorte quadrado atual: z = zoom (1 = imagem cobrindo o quadro), x/y = deslocamento em fração do quadro.
  function desenharCorte(canvas) {
    const img = fotoEditor.fonte, lado = canvas.width, ctx = canvas.getContext("2d");
    const w = img.naturalWidth, h = img.naturalHeight, esc0 = lado / Math.min(w, h), k = esc0 * fotoEditor.z;
    const dw = w * k, dh = h * k;
    const prender = (p, d) => (d <= lado ? (lado - d) / 2 / lado : Math.min(0, Math.max((lado - d) / lado, p)));
    fotoEditor.x = prender(fotoEditor.x, dw); fotoEditor.y = prender(fotoEditor.y, dh);
    if (fotoEditor.modo === "escudo") ctx.clearRect(0, 0, lado, lado); // escudo com fundo transparente
    else { ctx.fillStyle = "#262626"; ctx.fillRect(0, 0, lado, lado); }
    ctx.drawImage(img, fotoEditor.x * lado, fotoEditor.y * lado, dw, dh);
  }
  function fotoFinal() {
    const escudo = fotoEditor.modo === "escudo", c = document.createElement("canvas"); c.width = c.height = escudo ? 320 : 480;
    desenharCorte(c);
    if (!escudo) return c.toDataURL("image/jpeg", 0.86); // falha se o site da imagem não permitir cópia
    const webp = c.toDataURL("image/webp", 0.9);
    return /^data:image\/webp/.test(webp) ? webp : c.toDataURL("image/png");
  }
  async function prepararFoto(fonte) { // usada ao salvar um link sem passar pelo recorte
    fotoEditor.fonte = await carregarImagem(fonte); posicaoInicial(false);
    return fotoFinal();
  }
  function ligarFoto(caixa, buscar) {
    const campo = caixa.querySelector("[data-imagem]"); if (!campo) return;
    Object.assign(fotoEditor, { dados: "", removida: false, fonte: null, z: 1, x: 0, y: 0, modo: campo.dataset.prefixo === "escudo:" ? "escudo" : "foto" });
    const previa = $("#foto-previa"), aviso = $("#foto-aviso"), corte = $("#foto-corte"), tela2 = $("#foto-corte-tela"), zoom = $("#foto-zoom");
    const mostrar = (src, msg) => { previa.querySelectorAll("img").forEach((i) => i.remove()); if (src) previa.insertAdjacentHTML("afterbegin", '<img alt="" src="' + esc(src) + '">'); aviso.textContent = msg || ""; };
    const atualizar = () => { desenharCorte(tela2); try { fotoEditor.dados = fotoFinal(); mostrar(fotoEditor.dados, "Arraste a imagem e use o zoom para acertar o corte."); } catch (e) { fotoEditor.dados = ""; aviso.textContent = "O site dessa imagem não permite recortar. Copie a imagem e use Colar imagem."; } };
    const abrirCorte = () => { zoom.value = fotoEditor.z; corte.hidden = false; atualizar(); };
    const usarImagem = async (fonte, centralizar) => {
      aviso.textContent = "Preparando a imagem…";
      try {
        fotoEditor.fonte = await carregarImagem(fonte); fotoEditor.removida = false;
        posicaoInicial(centralizar);
        zoom.min = Math.min(1, fotoEditor.z).toFixed(2);
        if (typeof fonte !== "string" || /^data:/.test(fonte)) campo.value = "";
        abrirCorte();
      } catch (e) { aviso.textContent = typeof fonte === "string" ? "Não foi possível abrir esse link para recorte. Copie a imagem e use Colar imagem." : "Não foi possível ler essa imagem."; }
    };
    campo.addEventListener("paste", (ev) => {
      const item = [...(ev.clipboardData ? ev.clipboardData.items : [])].find((i) => /^image\//.test(i.type));
      if (item) { ev.preventDefault(); usarImagem(item.getAsFile()); }
    });
    campo.addEventListener("input", () => {
      fotoEditor.dados = ""; fotoEditor.fonte = null; corte.hidden = true;
      const u = campo.value.trim(); if (/^https?:\/\//.test(u)) mostrar(imagem(u, 200), "Link da imagem. Toque em Ajustar corte para enquadrar (se o site permitir).");
    });
    $("#foto-colar").onclick = async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.read) {
          for (const item of await navigator.clipboard.read()) {
            const tipo = item.types.find((t) => /^image\//.test(t));
            if (tipo) return usarImagem(await item.getType(tipo));
          }
        }
        const texto = navigator.clipboard && navigator.clipboard.readText ? (await navigator.clipboard.readText()).trim() : "";
        if (/^https?:\/\//.test(texto)) { campo.value = texto; campo.dispatchEvent(new Event("input")); return; }
        aviso.textContent = "Nada para colar. Copie uma imagem (ou o link dela) e tente de novo.";
      } catch (e) { aviso.textContent = "O aparelho não liberou a área de transferência. Toque no campo acima e use Colar."; }
    };
    const google = caixa.querySelector(".foto-botoes a");
    if (google && buscar) google.addEventListener("click", () => { google.href = "https://www.google.com/search?tbm=isch&q=" + encodeURIComponent(buscar().trim()); });
    $("#foto-arquivo-botao").onclick = () => $("#foto-arquivo").click();
    $("#foto-arquivo").onchange = (ev) => { const f = ev.target.files && ev.target.files[0]; if (f) usarImagem(f); };
    $("#foto-remover").onclick = () => { Object.assign(fotoEditor, { dados: "", removida: true, fonte: null }); corte.hidden = true; campo.value = ""; campo.dataset.guardada = ""; mostrar("", "A foto será removida ao salvar."); };
    // Ajustar corte: usa a imagem nova, o link digitado ou a foto já guardada.
    $("#foto-ajustar").onclick = () => {
      if (fotoEditor.fonte) return abrirCorte();
      const u = campo.value.trim(), atual = previa.querySelector("img");
      if (/^https?:\/\//.test(u)) return usarImagem(u, true);
      if (atual && atual.src && !atual.hidden) return usarImagem(atual.src, true);
      aviso.textContent = "Escolha uma imagem primeiro.";
    };
    $("#foto-corte-ok").onclick = () => { corte.hidden = true; if (fotoEditor.dados) aviso.textContent = "Corte pronto. Toque em Salvar e publicar."; };
    zoom.oninput = () => {
      // mantém o centro do quadro no mesmo ponto da imagem ao mudar o zoom
      const z0 = fotoEditor.z, z1 = parseFloat(zoom.value), f = z1 / z0;
      fotoEditor.x = 0.5 - (0.5 - fotoEditor.x) * f; fotoEditor.y = 0.5 - (0.5 - fotoEditor.y) * f; fotoEditor.z = z1;
      atualizar();
    };
    let arrasto = null;
    tela2.onpointerdown = (ev) => { if (!fotoEditor.fonte) return; ev.preventDefault(); tela2.setPointerCapture(ev.pointerId); arrasto = { id: ev.pointerId, px: ev.clientX, py: ev.clientY }; };
    tela2.onpointermove = (ev) => {
      if (!arrasto || ev.pointerId !== arrasto.id) return;
      const lado = tela2.getBoundingClientRect().width;
      fotoEditor.x += (ev.clientX - arrasto.px) / lado; fotoEditor.y += (ev.clientY - arrasto.py) / lado;
      arrasto.px = ev.clientX; arrasto.py = ev.clientY;
      desenharCorte(tela2);
    };
    tela2.onpointerup = tela2.onpointercancel = () => { if (arrasto) { arrasto = null; atualizar(); } };
    tela2.onwheel = (ev) => { if (!fotoEditor.fonte) return; ev.preventDefault(); zoom.value = Math.min(4, Math.max(parseFloat(zoom.min), fotoEditor.z * (ev.deltaY < 0 ? 1.08 : 1 / 1.08))); zoom.oninput(); };
  }
  // Grava a imagem no documento indicado pelo campo (fotos-<elenco> ou fotos-escudos) e devolve "foto:chave"/"escudo:chave".
  async function guardarImagem(campo, base, dadosImg, antiga) {
    const doc = campo.dataset.doc, prefixo = campo.dataset.prefixo;
    let pacote; try { pacote = await DIMAS.lerDoc(doc, true); } catch (e) { pacote = {}; }
    pacote.fotos = pacote.fotos || {};
    if (antiga && antiga.startsWith(prefixo)) delete pacote.fotos[antiga.slice(prefixo.length)];
    const chaveImg = DIMAS.slug(base || "imagem") + "-" + Date.now().toString(36);
    pacote.fotos[chaveImg] = dadosImg;
    await DIMAS.gravarDoc(doc, pacote);
    delete fotosPorElenco[doc];
    return prefixo + chaveImg;
  }
  // Valor final do campo de imagem ao salvar: imagem nova guardada na base, link digitado, a guardada de antes ou vazio.
  async function resolverImagem(campo, valor, base) {
    if (!campo) return valor;
    const guardada = campo.dataset.guardada || "";
    let dadosImg = fotoEditor.dados;
    if (!dadosImg && /^https?:\/\//.test(valor) && !DIMAS.driveId(valor) && valor !== campo.dataset.original) { try { dadosImg = await prepararFoto(valor); } catch (e) {} } // copia o link para a base quando o site deixa
    if (dadosImg) return guardarImagem(campo, base, dadosImg, guardada || campo.dataset.original);
    if (!valor && guardada && !fotoEditor.removida) return guardada;
    return valor;
  }
  // Exclui o atleta do elenco (app publicado e rascunho do painel) e apaga a foto guardada dele.
  async function excluirAtleta(a, equipe) {
    if (!(await DIMAS.confirmar("Excluir " + a.nome + " do elenco do " + equipe.nome + "? A ficha, a análise e a foto dele serão apagadas.", "Excluir"))) return;
    const erro = $("#editor-erro"), botao = $("#editor-excluir");
    botao.disabled = true; botao.textContent = "Excluindo…"; erro.textContent = "";
    const tirar = (pacote) => { const lista = (pacote.abas || {})["ADVERSÁRIOS"] || []; const l = acharLinha(pacote, a); if (!l) return null; lista.splice(lista.indexOf(l), 1); return l; };
    try {
      const publicado = await DIMAS.lerDoc("publicado", true);
      const linha = tirar(publicado);
      if (!linha) throw new Error("Este atleta não está mais na base. Atualize o app.");
      publicado.publicadoEm = new Date().toISOString();
      await DIMAS.gravarDoc("publicado", publicado);
      try { const rascunho = await DIMAS.lerDoc("rascunho", true); if (tirar(rascunho)) await DIMAS.gravarDoc("rascunho", rascunho); } catch (e) {}
      if (/^foto:/.test(linha.Imagem || "")) {
        try { const doc = "fotos-" + DIMAS.slug(a.equipe), f = await DIMAS.lerDoc(doc, true); if (f.fotos) { delete f.fotos[linha.Imagem.slice(5)]; await DIMAS.gravarDoc(doc, f); delete fotosPorElenco[doc]; } } catch (e) {}
      }
      DIMAS.guarda.gravar(DIMAS.CHAVES.dados, JSON.stringify(publicado));
      dados = DIMAS.normalizar(publicado);
      $("#editor").close();
      estado.equipeNaTela = "";
      const destino = "#/e/" + encodeURIComponent(equipe.id);
      if (location.hash === destino) rota(); else location.hash = destino;
      aviso(a.nome + " foi excluído do elenco.");
    } catch (e) {
      erro.textContent = e.message === "Failed to fetch" ? "Sem internet. Nada foi excluído." : "Não foi possível excluir: " + e.message;
      botao.disabled = false; botao.textContent = "Excluir atleta";
    }
  }
  async function salvarEdicao(a, equipe) {
    const erro = $("#editor-erro"), botao = $("#editor-salvar"), novos = {};
    document.querySelectorAll("#form-editor [data-campo]").forEach((el) => { novos[el.dataset.campo] = el.value.trim(); });
    if (!novos.Atleta) { erro.textContent = "Informe o nome."; return; }
    if (novos.Nascimento && !DIMAS.idadeDe(novos.Nascimento)) { erro.textContent = "Nascimento deve estar no formato dd/mm/aaaa."; return; }
    if (novos.Video && !midia(novos.Video)) { erro.textContent = "O link do vídeo não parece válido. Use um link do YouTube ou do Google Drive."; return; }
    if (novos.Nascimento) novos.Idade = DIMAS.idadeDe(novos.Nascimento) + " Anos";
    novos.Ordem = String(DIMAS.ordemDa(novos["Função"]));
    if (a.novo) { a.nome = novos.Atleta; novos["Adversário"] = a.equipe; }
    const aplicar = (pacote) => {
      if (a.novo) {
        const lista = ((pacote.abas = pacote.abas || {})["ADVERSÁRIOS"] = pacote.abas["ADVERSÁRIOS"] || []);
        if (acharLinha(pacote, a)) return "existe";
        const linha = Object.fromEntries(Object.keys(lista[0] || {}).map((k) => [k, ""]));
        lista.push(Object.assign(linha, novos)); return true;
      }
      const l = acharLinha(pacote, a); if (!l) return false; Object.assign(l, novos); return true;
    };
    if (a.novo && acharLinha(DIMAS.pacoteLocal(), a)) { erro.textContent = "Já existe um atleta com esse nome neste elenco."; return; }
    erro.textContent = ""; botao.disabled = true; botao.textContent = "Salvando…";
    try {
      novos.Imagem = await resolverImagem(document.querySelector("#form-editor [data-imagem]"), novos.Imagem, novos.Atleta);
      const publicado = await DIMAS.lerDoc("publicado", true); // parte sempre da versão mais recente
      const ok = aplicar(publicado);
      if (ok === "existe") throw new Error("já existe um atleta com esse nome neste elenco.");
      if (!ok) throw new Error("Este atleta não está mais na base. Atualize o app e tente de novo.");
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
      aviso(a.novo ? "Atleta incluído e publicado." : "Atleta atualizado e publicado.");
    } catch (e) {
      erro.textContent = e.message === "Failed to fetch" ? "Sem internet. A edição não foi salva." : "Não foi possível salvar: " + e.message;
    } finally { botao.disabled = false; botao.textContent = "Salvar e publicar"; }
  }

  /* ---------- competições e equipes: incluir, editar e excluir (só administradores) ---------- */
  // Formulário simples no mesmo diálogo do editor de atleta.
  function abrirFormulario({ titulo, subtitulo, campos, buscar, salvar, excluir, rotuloExcluir }) {
    let caixa = $("#editor");
    if (!caixa) { caixa = document.createElement("dialog"); caixa.id = "editor"; caixa.className = "editor"; document.body.appendChild(caixa); }
    const campo = (c, k) => {
      const id = "fm" + k;
      const entrada = c.tipo === "imagem"
        ? campoImagemHtml({ id, nome: c.nome, valor: c.valor || "", doc: "fotos-escudos", prefixo: "escudo:", sigla: iniciais(c.sigla || "?") })
        : '<input type="text" id="' + id + '" data-campo="' + esc(c.nome) + '" value="' + esc(c.valor || "") + '" placeholder="' + esc(c.dica || "") + '" autocomplete="off">';
      return '<div class="larga"><label for="' + id + '">' + esc(c.rotulo) + "</label>" + entrada + "</div>";
    };
    caixa.innerHTML = '<form method="dialog" id="form-editor"><h2 class="titulo">' + esc(titulo) + "</h2>" + (subtitulo ? '<p class="suave">' + esc(subtitulo) + "</p>" : "") +
      '<div class="editor-grade">' + campos.map(campo).join("") + '</div><p class="entrada-erro" id="editor-erro" role="alert"></p><div class="editor-rodape">' +
      (excluir ? '<button type="button" class="botao contorno perigo" id="editor-excluir">' + esc(rotuloExcluir || "Excluir") + "</button>" : "") +
      '<button type="button" class="botao contorno" id="editor-cancelar">Cancelar</button><button type="submit" class="botao" id="editor-salvar">Salvar e publicar</button></div></form>';
    const erro = $("#editor-erro"), botao = $("#editor-salvar");
    $("#editor-cancelar").onclick = () => caixa.close();
    ligarFoto(caixa, buscar);
    const falhou = (e, acao) => { erro.textContent = e.message === "Failed to fetch" ? "Sem internet. Nada foi " + acao + "." : "Não foi possível: " + e.message; };
    $("#form-editor").onsubmit = async (ev) => {
      ev.preventDefault();
      const v = {}; caixa.querySelectorAll("[data-campo]").forEach((el) => { v[el.dataset.campo] = el.value.trim(); });
      erro.textContent = ""; botao.disabled = true; botao.textContent = "Salvando…";
      try { await salvar(v, caixa); caixa.close(); } catch (e) { falhou(e, "salvo"); } finally { botao.disabled = false; botao.textContent = "Salvar e publicar"; }
    };
    if (excluir) $("#editor-excluir").onclick = async () => {
      const b = $("#editor-excluir"); erro.textContent = "";
      try { b.disabled = true; if (await excluir()) caixa.close(); } catch (e) { falhou(e, "excluído"); } finally { b.disabled = false; }
    };
    caixa.showModal();
    pintarFotos();
    const primeiro = caixa.querySelector("[data-campo]"); if (primeiro) primeiro.focus();
  }
  // Aplica uma mudança no app publicado e no rascunho do painel e atualiza a tela.
  async function mudarBase(mudar) {
    const publicado = await DIMAS.lerDoc("publicado", true);
    publicado.abas = publicado.abas || {};
    mudar(publicado);
    publicado.publicadoEm = new Date().toISOString();
    await DIMAS.gravarDoc("publicado", publicado);
    try { const rascunho = await DIMAS.lerDoc("rascunho", true); rascunho.abas = rascunho.abas || {}; mudar(rascunho); await DIMAS.gravarDoc("rascunho", rascunho); } catch (e) {} // mantém o painel em dia
    DIMAS.guarda.gravar(DIMAS.CHAVES.dados, JSON.stringify(publicado));
    dados = DIMAS.normalizar(publicado);
    estado.equipeNaTela = "";
  }
  const aba = (pacote, nome) => (pacote.abas[nome] = pacote.abas[nome] || []);
  const nomeComp = (l) => l["Competições"] || l["Competição"] || l["Campeonato"] || "";
  const compDaEquipe = (l) => l["Competição"] || l["Competições"] || "";
  const nomeTime = (l) => l.Time || l.Equipe || "";
  const elencoDe = (l) => l.Elenco || nomeTime(l);
  const ir = (destino) => { if (location.hash === destino) rota(); else location.hash = destino; };
  // Tira as equipes indicadas e o elenco delas (se nenhuma outra equipe usar o mesmo elenco).
  function tirarEquipes(pacote, remover) {
    const equipes = aba(pacote, "EQUIPES"), saem = equipes.filter(remover), ficam = equipes.filter((l) => !remover(l));
    pacote.abas["EQUIPES"] = ficam;
    const emUso = new Set(ficam.map((l) => chave(elencoDe(l))));
    const elencos = new Set(saem.map((l) => chave(elencoDe(l))).filter((k) => !emUso.has(k)));
    const atletas = aba(pacote, "ADVERSÁRIOS");
    pacote.abas["ADVERSÁRIOS"] = atletas.filter((a) => !elencos.has(chave(a["Adversário"] || "")));
    return { equipes: saem.length, atletas: atletas.length - pacote.abas["ADVERSÁRIOS"].length };
  }

  // Apaga do documento de escudos as imagens guardadas ("escudo:chave") que não são mais usadas.
  async function apagarEscudos(valores) {
    const chaves = valores.filter((v) => /^escudo:/.test(v || "")).map((v) => v.slice(7)); if (!chaves.length) return;
    try { const f = await DIMAS.lerDoc("fotos-escudos", true); chaves.forEach((k) => delete (f.fotos || {})[k]); await DIMAS.gravarDoc("fotos-escudos", f); delete fotosPorElenco["fotos-escudos"]; } catch (e) {}
  }
  function formCompeticao(c) {
    const linha = c ? (aba(DIMAS.pacoteLocal(), "CAMPEONATOS").find((l) => DIMAS.slug(nomeComp(l)) === c.id) || {}) : {};
    const nEquipes = c ? dados.equipes.filter((e) => e.competicaoId === c.id).length : 0;
    abrirFormulario({
      titulo: c ? "Editar competição" : "Incluir competição",
      campos: [
        { nome: "Competições", rotulo: "Nome da competição", valor: c ? c.nome : "", dica: "Ex.: Copa do Nordeste 2027" },
        { nome: "Imagem Competições", rotulo: "Imagem da competição", tipo: "imagem", valor: linha["Imagem Competições"] || linha["Imagem"] || "", sigla: c ? c.nome : "?" },
      ],
      buscar: () => $("#fm0").value + " logo",
      salvar: async (v, caixa) => {
        const nome = v["Competições"]; if (!nome) throw new Error("informe o nome da competição.");
        const novoId = DIMAS.slug(nome);
        if (dados.competicoes.some((x) => x.id === novoId && (!c || x.id !== c.id))) throw new Error("já existe uma competição com esse nome.");
        const img = await resolverImagem(caixa.querySelector("[data-imagem]"), v["Imagem Competições"], nome);
        await mudarBase((p) => {
          const lista = aba(p, "CAMPEONATOS");
          if (!c) { lista.push({ "Competições": nome, "Imagem Competições": img }); return; }
          const l = lista.find((x) => DIMAS.slug(nomeComp(x)) === c.id); if (!l) return;
          const chaveNome = "Competições" in l ? "Competições" : "Competição" in l ? "Competição" : "Campeonato";
          l[chaveNome] = nome; l["Imagem Competições"] = img; delete l["Imagem"];
          if (nome !== c.nome) aba(p, "EQUIPES").forEach((e) => { if (DIMAS.slug(compDaEquipe(e)) === c.id) { if (!e.Elenco) e.Elenco = nomeTime(e); e["Competição"] = nome; } });
        });
        ir("#/c/" + encodeURIComponent(novoId));
        aviso(c ? "Competição atualizada e publicada." : "Competição incluída. Agora inclua as equipes.");
      },
      rotuloExcluir: "Excluir competição",
      excluir: c && (async () => {
        const nAtletas = dados.atletas.filter((a) => dados.equipes.some((e) => e.competicaoId === c.id && e.elencoChave === a.equipeChave)).length;
        if (!(await DIMAS.confirmar("Excluir a competição " + c.nome + "? Saem também " + plural(nEquipes, "equipe", "equipes") + " e os elencos delas (até " + plural(nAtletas, "atleta", "atletas") + "). Não dá para desfazer.", "Excluir"))) return false;
        const imagens = [linha["Imagem Competições"]].concat(aba(DIMAS.pacoteLocal(), "EQUIPES").filter((l) => DIMAS.slug(compDaEquipe(l)) === c.id).map((l) => l["Time Imagem"]));
        await mudarBase((p) => {
          p.abas["CAMPEONATOS"] = aba(p, "CAMPEONATOS").filter((l) => DIMAS.slug(nomeComp(l)) !== c.id);
          tirarEquipes(p, (l) => DIMAS.slug(compDaEquipe(l)) === c.id);
        });
        await apagarEscudos(imagens);
        ir("#/"); aviso("Competição " + c.nome + " excluída.");
        return true;
      }),
    });
  }

  function formEquipe(comp, e) {
    const linha = e ? (aba(DIMAS.pacoteLocal(), "EQUIPES").find((l) => DIMAS.slug(compDaEquipe(l)) === e.competicaoId && DIMAS.slug(nomeTime(l)) === DIMAS.slug(e.nome)) || {}) : {};
    abrirFormulario({
      titulo: e ? "Editar equipe" : "Incluir equipe",
      subtitulo: comp.nome,
      campos: [
        { nome: "Time", rotulo: "Nome da equipe", valor: e ? e.nome : "", dica: "Ex.: Fortaleza" },
        { nome: "Time Imagem", rotulo: "Escudo", tipo: "imagem", valor: linha["Time Imagem"] || "", sigla: e ? e.nome : "?" },
        { nome: "Relatório de Adversário", rotulo: "Relatório do adversário (link do Google Drive)", valor: linha["Relatório de Adversário"] || "" },
        { nome: "Material de Pré-jogo 1", rotulo: "Análise do adversário (link do YouTube ou do Google Drive)", valor: linha["Material de Pré-jogo 1"] || "" },
      ],
      buscar: () => $("#fm0").value + " escudo",
      salvar: async (v, caixa) => {
        const nome = v.Time; if (!nome) throw new Error("informe o nome da equipe.");
        const novoId = comp.id + "--" + DIMAS.slug(nome);
        if (dados.equipes.some((x) => x.id === novoId && (!e || x.id !== e.id))) throw new Error("essa equipe já está nesta competição.");
        const img = await resolverImagem(caixa.querySelector("[data-imagem]"), v["Time Imagem"], nome);
        const campos = { Time: nome, "Time Imagem": img, "Relatório de Adversário": v["Relatório de Adversário"], "Material de Pré-jogo 1": v["Material de Pré-jogo 1"] };
        await mudarBase((p) => {
          const lista = aba(p, "EQUIPES");
          if (!e) { lista.push(Object.assign({ "Competição": comp.nome, Elenco: nome + " · " + comp.nome }, campos)); return; }
          const l = lista.find((x) => DIMAS.slug(compDaEquipe(x)) === e.competicaoId && DIMAS.slug(nomeTime(x)) === DIMAS.slug(e.nome)); if (!l) return;
          if (!l.Elenco) l.Elenco = nomeTime(l); // mantém o elenco ligado à equipe ao trocar o nome
          if ("Equipe" in l && !("Time" in l)) delete l.Equipe;
          Object.assign(l, campos);
        });
        ir("#/e/" + encodeURIComponent(novoId));
        aviso(e ? "Equipe atualizada e publicada." : "Equipe incluída. Agora inclua os atletas.");
      },
      rotuloExcluir: "Excluir equipe",
      excluir: e && (async () => {
        const n = dados.atletas.filter((a) => a.equipeChave === e.elencoChave).length;
        const compartilhado = dados.equipes.some((x) => x.id !== e.id && x.elencoChave === e.elencoChave);
        if (!(await DIMAS.confirmar("Excluir " + e.nome + " de " + comp.nome + "?" + (n && !compartilhado ? " Sai também o elenco (" + plural(n, "atleta", "atletas") + ")." : "") + " Não dá para desfazer.", "Excluir"))) return false;
        await mudarBase((p) => { tirarEquipes(p, (l) => DIMAS.slug(compDaEquipe(l)) === e.competicaoId && DIMAS.slug(nomeTime(l)) === DIMAS.slug(e.nome)); });
        await apagarEscudos([linha["Time Imagem"]]);
        ir("#/c/" + encodeURIComponent(comp.id)); aviso(e.nome + " excluída de " + comp.nome + ".");
        return true;
      }),
    });
  }

  /* ---------- eventos ---------- */
  document.addEventListener("click", (ev) => {
    const el = ev.target.closest("[data-abrir],[data-tocar],[data-fechar],[data-editar],[data-incluir],[data-acao]");
    if (!el) return;
    if (el.dataset.editar) { abrirEditor(el.dataset.editar); return; }
    if (el.dataset.acao) {
      if (!ehAdmin()) return;
      const acao = el.dataset.acao, id = el.dataset.id;
      if (acao === "incluir-competicao") formCompeticao(null);
      else if (acao === "editar-competicao") formCompeticao(dados.competicoes.find((c) => c.id === id));
      else if (acao === "incluir-equipe") formEquipe(dados.competicoes.find((c) => c.id === id), null);
      else if (acao === "editar-equipe") { const e = dados.equipes.find((x) => x.id === id); if (e) formEquipe(dados.competicoes.find((c) => c.id === e.competicaoId) || { id: e.competicaoId, nome: e.competicao }, e); }
      return;
    }
    if (el.dataset.incluir) {
      const equipe = dados.equipes.find((e) => e.id === el.dataset.incluir); if (!equipe) return;
      estado.equipe = equipe; estado.atleta = { novo: true, nome: "", equipe: equipe.elenco, equipeChave: equipe.elencoChave };
      abrirEditor("Atleta"); return;
    }
    if (el.dataset.abrir) abrirJanela(el.dataset.abrir, el.dataset.externo, el.dataset.titulo);
    else if (el.dataset.tocar) el.parentElement.innerHTML = '<iframe src="' + esc(el.dataset.tocar) + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
    else if (el.hasAttribute("data-fechar")) fecharCamadas();
  });
  tela.addEventListener("change", (ev) => {
    if (ev.target.id !== "filtro-funcao") return;
    estado.filtro = ev.target.value;
    const partes = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
    const equipe = dados.equipes.find((e) => e.id === partes[1]);
    if (equipe) $("#elenco").innerHTML = htmlElenco(equipe, atletasDa(equipe), partes[2] || "");
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

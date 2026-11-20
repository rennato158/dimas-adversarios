/* Painel de controle do DIMAS Adversários: cadastro, importação de elenco e publicação. */
(function () {
  const { esc, chave, dataHora, guarda, CHAVES } = DIMAS;
  const $ = (s) => document.querySelector(s);
  const copia = (o) => JSON.parse(JSON.stringify(o));
  const ABAS = ["CAMPEONATOS", "EQUIPES", "ADVERSÁRIOS"];
  const NOME = { CAMPEONATOS: "Competições", EQUIPES: "Time", "ADVERSÁRIOS": "Atleta" };
  const TITULO = { CAMPEONATOS: "competição", EQUIPES: "equipe", "ADVERSÁRIOS": "atleta" };
  const CAMPOS = {
    CAMPEONATOS: [["Competições", "Nome", "texto", "larga"], ["Imagem Competições", "Imagem (link do Google Drive ou endereço da imagem)", "texto", "larga"]],
    EQUIPES: [["Time", "Nome", "texto"], ["Competição", "Competição", "competicao"], ["Time Imagem", "Escudo (link do Google Drive ou endereço da imagem)", "texto", "larga"],
      ["Relatório de Adversário", "Relatório do adversário (link do Google Drive)", "texto", "larga"], ["Material de Pré-jogo 1", "Análise em vídeo (link do Google Drive ou YouTube)", "texto", "larga"]],
    "ADVERSÁRIOS": [["Atleta", "Nome", "texto"], ["Adversário", "Equipe", "equipe"], ["Função", "Função", "funcao"], ["Pé dominante", "Pé dominante", "pe"],
      ["Nascimento", "Nascimento (dd/mm/aaaa)", "texto"], ["Estatura", "Estatura (cm)", "texto"], ["Imagem", "Foto (link do Google Drive ou endereço da imagem)", "texto", "larga"],
      ["Video", "Vídeo (link do Google Drive ou YouTube)", "texto", "larga"], ["Histórico (site oGol)", "Histórico no oGol (link)", "texto", "larga"],
      ["Análise Individual", "Características individuais", "area", "larga"], ["Ponto forte", "Pontos fortes (um por linha)", "area"], ["Ponto vulnerável", "Pontos vulneráveis (um por linha)", "area"]],
  };

  /* ---------- estado ---------- */
  let publicado = DIMAS.pacoteLocal();
  let rascunho;
  try { rascunho = JSON.parse(guarda.ler(CHAVES.rascunho) || "null"); } catch (e) { rascunho = null; }
  if (!rascunho || !rascunho.abas) rascunho = { abas: copia(publicado.abas || {}) };
  ABAS.forEach((a) => { if (!Array.isArray(rascunho.abas[a])) rascunho.abas[a] = []; });
  let aba = "ADVERSÁRIOS";
  const linhas = (a) => rascunho.abas[a || aba];
  const pendente = () => JSON.stringify(ABAS.map((a) => rascunho.abas[a])) !== JSON.stringify(ABAS.map((a) => (publicado.abas || {})[a] || []));
  const logado = () => DIMAS.conectado() && !!DIMAS.sessao();
  const vazio = (p) => !p || !p.abas || ABAS.every((a) => !(p.abas[a] || []).length);

  /* Traz a base online para este navegador. Sem dados locais, adota o rascunho online (ou a versão publicada). */
  async function sincronizar(perguntar) {
    try { publicado = await DIMAS.buscarPublicado(); } catch (e) { if (e.codigo === "PERMISSION_DENIED") throw e; }
    let remoto = null;
    try { remoto = await DIMAS.lerDoc("rascunho", true); } catch (e) { if (e.codigo === "PERMISSION_DENIED") throw e; }
    const online = !vazio(remoto) ? remoto : !vazio(publicado) ? { abas: copia(publicado.abas) } : null;
    if (!online) return "vazia";
    const igual = JSON.stringify(ABAS.map((a) => online.abas[a] || [])) === JSON.stringify(ABAS.map((a) => rascunho.abas[a]));
    if (vazio(rascunho) || (!igual && perguntar && confirm("Este navegador tem um rascunho diferente da base online. OK para carregar a base online; Cancelar para manter o daqui."))) {
      rascunho = { abas: copia(online.abas) };
      ABAS.forEach((a) => { if (!Array.isArray(rascunho.abas[a])) rascunho.abas[a] = []; });
      guarda.gravar(CHAVES.rascunho, JSON.stringify(rascunho));
    }
    return "ok";
  }

  function retorno(tipo, msg) { const el = $("#retorno"); el.className = "retorno " + tipo; el.textContent = msg; }

  let espera;
  function salvarRascunho() {
    guarda.gravar(CHAVES.rascunho, JSON.stringify(rascunho));
    if (logado()) {
      clearTimeout(espera);
      espera = setTimeout(() => DIMAS.gravarDoc("rascunho", rascunho).catch((e) => retorno("erro", "O rascunho não foi salvo na base online: " + e.message)), 1200);
    }
    desenhar();
  }

  /* ---------- desenho ---------- */
  function desenhar() {
    const d = DIMAS.normalizar({ abas: rascunho.abas });
    $("#versao").textContent = dataHora(publicado.publicadoEm);
    $("#selo").innerHTML = pendente() ? '<span class="selo">Há alterações não publicadas</span>' : '<span class="selo ok">Tudo publicado</span>';
    $("#modo").textContent = logado() ? "Base online conectada como " + DIMAS.sessao().email + "." : DIMAS.conectado() ? "Base online configurada. Entre com a conta de administrador para publicar." : "Base online ainda não conectada: as alterações ficam só neste navegador.";
    const n = (v, r) => "<div><b>" + v + "</b><span>" + r + "</span></div>";
    $("#contagem").innerHTML = n(d.competicoes.length, "Competições") + n(d.equipes.length, "Equipes") + n(d.atletas.length, "Atletas") + n(d.atletas.filter((a) => a.video).length, "Vídeos");
    $("#estado-conexao").textContent = logado() ? "Conectado. Rascunho e publicação são gravados no Firebase." : "Preencha os dados do projeto e a conta de administrador para gravar online.";
    $("#sair").hidden = !logado();
    filtroEquipes(); tabela(); pendencias(d);
  }

  function nomesEquipes() {
    const nomes = linhas("EQUIPES").map((e) => e.Time).filter(Boolean);
    linhas("ADVERSÁRIOS").forEach((a) => { if (a["Adversário"] && !nomes.some((n) => chave(n) === chave(a["Adversário"]))) nomes.push(a["Adversário"]); });
    return [...new Set(nomes)];
  }
  function filtroEquipes() {
    const sel = $("#filtro-equipe"), atual = sel.value;
    sel.innerHTML = '<option value="">Todas as equipes</option>' + nomesEquipes().map((n) => '<option value="' + esc(n) + '">' + esc(n) + "</option>").join("");
    sel.value = [...sel.options].some((o) => o.value === atual) ? atual : "";
    sel.hidden = aba !== "ADVERSÁRIOS"; $("#importar").hidden = aba !== "ADVERSÁRIOS";
  }

  function tabela() {
    const t = chave($("#filtro").value), eq = $("#filtro-equipe").value;
    const sn = (v) => '<td class="' + (v ? "sim" : "nao") + '">' + (v ? "Sim" : "—") + "</td>";
    const todas = linhas().map((l, i) => ({ l, i }));
    let visiveis, cab, corpo;
    if (aba === "ADVERSÁRIOS") {
      visiveis = todas.filter(({ l }) => (!eq || chave(l["Adversário"]) === chave(eq)) && (!t || chave(l.Atleta + " " + l["Função"] + " " + l["Adversário"]).includes(t)))
        .sort((a, b) => chave(a.l["Adversário"]).localeCompare(chave(b.l["Adversário"])) || DIMAS.ordemDa(a.l["Função"]) - DIMAS.ordemDa(b.l["Função"]) || a.i - b.i);
      cab = "<th>Atleta</th><th>Equipe</th><th>Função</th><th>Idade</th><th>Estatura</th><th>Pé</th><th>Foto</th><th>Análise</th><th>Vídeo</th>";
      corpo = ({ l, i }) => '<tr data-i="' + i + '"><td>' + esc(l.Atleta) + "</td><td>" + esc(l["Adversário"]) + "</td><td>" + esc(l["Função"] || "—") + "</td><td>" + (DIMAS.idadeDe(l.Nascimento) || parseInt(l.Idade, 10) || "—") +
        "</td><td>" + esc(l.Estatura || "—") + "</td><td>" + esc(l["Pé dominante"] || "—") + "</td>" + sn(l.Imagem) + sn(l["Análise Individual"] || l["Ponto forte"] || l["Ponto vulnerável"]) + sn(l.Video) + "</tr>";
    } else if (aba === "EQUIPES") {
      visiveis = todas.filter(({ l }) => !t || chave(l.Time + " " + l["Competição"]).includes(t));
      cab = "<th>Equipe</th><th>Competição</th><th>Atletas</th><th>Escudo</th><th>Relatório</th><th>Análise em vídeo</th>";
      corpo = ({ l, i }) => '<tr data-i="' + i + '"><td>' + esc(l.Time) + "</td><td>" + esc(l["Competição"] || "—") + "</td><td>" + linhas("ADVERSÁRIOS").filter((a) => chave(a["Adversário"]) === chave(l.Time)).length + "</td>" +
        sn(l["Time Imagem"]) + sn(l["Relatório de Adversário"]) + sn(l["Material de Pré-jogo 1"]) + "</tr>";
    } else {
      visiveis = todas.filter(({ l }) => !t || chave(l["Competições"]).includes(t));
      cab = "<th>Competição</th><th>Equipes</th><th>Imagem</th>";
      corpo = ({ l, i }) => '<tr data-i="' + i + '"><td>' + esc(l["Competições"]) + "</td><td>" + linhas("EQUIPES").filter((e) => chave(e["Competição"]) === chave(l["Competições"])).length + "</td>" + sn(l["Imagem Competições"]) + "</tr>";
    }
    $("#tabela").innerHTML = "<thead><tr>" + cab + "</tr></thead><tbody>" + visiveis.map(corpo).join("") + "</tbody>";
    $("#resumo-tabela").textContent = visiveis.length + " de " + todas.length + " · clique em uma linha para editar.";
    $("#novo").textContent = "Nova " + TITULO[aba]; if (aba === "ADVERSÁRIOS") $("#novo").textContent = "Novo atleta";
  }

  function pendencias(d) {
    const nomes = new Set(d.equipes.map((e) => chave(e.nome))), comElenco = new Set(d.atletas.map((a) => a.equipeChave));
    const exemplos = (l, f) => l.slice(0, 6).map(f).join(", ") + (l.length > 6 ? "…" : "");
    const itens = [];
    const orfas = [...new Set(d.atletas.filter((a) => !nomes.has(a.equipeChave)).map((a) => a.equipe))];
    if (orfas.length) itens.push([orfas.length, "Equipes citadas em atletas mas não cadastradas (o elenco não aparece no app)", orfas.join(", ")]);
    const semComp = d.equipes.filter((e) => !d.competicoes.some((c) => c.id === e.competicaoId));
    if (semComp.length) itens.push([semComp.length, "Equipes sem competição válida (não aparecem no app)", exemplos(semComp, (e) => e.nome)]);
    const semElenco = d.equipes.filter((e) => !comElenco.has(chave(e.nome)));
    if (semElenco.length) itens.push([semElenco.length, "Equipes sem elenco cadastrado", exemplos(semElenco, (e) => e.nome)]);
    const semRel = d.equipes.filter((e) => !e.relatorio);
    if (semRel.length) itens.push([semRel.length, "Equipes sem relatório do adversário", exemplos(semRel, (e) => e.nome)]);
    const semFuncao = d.atletas.filter((a) => a.funcao === "Sem função" || a.funcao === "Meio-campista");
    if (semFuncao.length) itens.push([semFuncao.length, "Atletas com função a definir (sem função ou “Meio-campista” genérico vindo da importação)", ""]);
    const semFoto = d.atletas.filter((a) => !a.imagem);
    if (semFoto.length) itens.push([semFoto.length, "Atletas sem foto", exemplos(semFoto, (a) => a.nome + " (" + a.equipe + ")")]);
    const semAnalise = d.atletas.filter((a) => !a.analise && !a.forte && !a.vulneravel);
    if (semAnalise.length) itens.push([semAnalise.length, "Atletas sem características, pontos fortes ou vulneráveis", ""]);
    const semVideo = d.atletas.filter((a) => !a.video);
    if (semVideo.length) itens.push([semVideo.length, "Atletas sem vídeo", ""]);
    $("#pendencias").innerHTML = itens.length ? itens.map((i) => "<li><b>" + i[0] + "</b><span>" + esc(i[1]) + (i[2] ? "<small>" + esc(i[2]) + "</small>" : "") + "</span></li>").join("") : "<li>Nenhuma pendência encontrada.</li>";
  }

  /* ---------- ficha de edição ---------- */
  function abrirFicha(indice) {
    const novo = indice == null;
    const l = novo ? {} : linhas()[indice];
    if (novo && aba === "ADVERSÁRIOS") l["Adversário"] = $("#filtro-equipe").value;
    const opcoes = (lista, atual) => (atual && !lista.some((x) => chave(x) === chave(atual)) ? [atual] : []).concat(lista).map((x) => '<option' + (chave(x) === chave(atual) ? " selected" : "") + ">" + esc(x) + "</option>").join("");
    const campo = ([nome, rotulo, tipo, classe], k) => {
      const v = l[nome] || "", id = "c" + k;
      let entrada;
      if (tipo === "area") entrada = '<textarea id="' + id + '" data-campo="' + esc(nome) + '">' + esc(v) + "</textarea>";
      else if (tipo === "competicao") entrada = '<select id="' + id + '" data-campo="' + esc(nome) + '"><option value="">—</option>' + opcoes(linhas("CAMPEONATOS").map((c) => c["Competições"]), v) + "</select>";
      else if (tipo === "equipe") entrada = '<select id="' + id + '" data-campo="' + esc(nome) + '"><option value="">—</option>' + opcoes(nomesEquipes(), v) + "</select>";
      else if (tipo === "funcao") entrada = '<select id="' + id + '" data-campo="' + esc(nome) + '"><option value="">—</option>' + opcoes(DIMAS.FUNCOES, v === "Sem função" ? "" : v) + "</select>";
      else if (tipo === "pe") entrada = '<select id="' + id + '" data-campo="' + esc(nome) + '"><option value="">—</option>' + opcoes(["Destro", "Canhoto", "Ambidestro"], v) + "</select>";
      else entrada = '<input type="text" id="' + id + '" data-campo="' + esc(nome) + '" value="' + esc(v) + '" autocomplete="off">';
      return '<div class="' + (classe || "") + '"><label for="' + id + '">' + esc(rotulo) + "</label>" + entrada + "</div>";
    };
    $("#form-ficha").innerHTML = "<h2>" + (novo ? "Cadastrar " : "Editar ") + TITULO[aba] + '</h2><div class="duas">' + CAMPOS[aba].map(campo).join("") + '</div><p class="retorno erro" id="erro-ficha" style="display:none"></p>' +
      '<div class="rodape-form">' + (novo ? "" : '<button type="button" class="botao perigo" id="excluir">Excluir</button>') + '<span class="espaco"></span><button type="button" class="botao contorno" id="cancelar">Cancelar</button><button type="submit" class="botao">Salvar</button></div>';
    $("#form-ficha").onsubmit = (ev) => { ev.preventDefault(); salvarFicha(indice); };
    $("#cancelar").onclick = () => $("#ficha").close();
    if (!novo) $("#excluir").onclick = () => excluir(indice);
    $("#ficha").showModal();
  }

  function salvarFicha(indice) {
    const novo = indice == null, antigo = novo ? {} : linhas()[indice], l = Object.assign({}, antigo);
    document.querySelectorAll("#form-ficha [data-campo]").forEach((el) => { l[el.dataset.campo] = el.value.trim(); });
    const erro = (m) => { const e = $("#erro-ficha"); e.textContent = m; e.style.display = "block"; };
    if (!l[NOME[aba]]) return erro("Informe o nome.");
    if (linhas().some((x, i) => i !== indice && chave(x[NOME[aba]]) === chave(l[NOME[aba]]) && (aba !== "ADVERSÁRIOS" || chave(x["Adversário"]) === chave(l["Adversário"])) && (aba !== "EQUIPES" || chave(x["Competição"]) === chave(l["Competição"])))) return erro("Já existe um cadastro com esse nome.");
    if (aba === "ADVERSÁRIOS") {
      if (!l["Adversário"]) return erro("Escolha a equipe do atleta.");
      if (l.Nascimento && !DIMAS.idadeDe(l.Nascimento)) return erro("Nascimento deve estar no formato dd/mm/aaaa.");
      if (l.Nascimento) l.Idade = DIMAS.idadeDe(l.Nascimento) + " Anos";
      l.Ordem = String(DIMAS.ordemDa(l["Função"]));
    }
    // renomear em cascata
    if (!novo && aba === "EQUIPES" && antigo.Time !== l.Time) linhas("ADVERSÁRIOS").forEach((a) => { if (chave(a["Adversário"]) === chave(antigo.Time)) a["Adversário"] = l.Time; });
    if (!novo && aba === "CAMPEONATOS" && antigo["Competições"] !== l["Competições"]) linhas("EQUIPES").forEach((e) => { if (chave(e["Competição"]) === chave(antigo["Competições"])) e["Competição"] = l["Competições"]; });
    if (novo) linhas().push(l); else linhas()[indice] = l;
    $("#ficha").close(); salvarRascunho();
    retorno("info", (novo ? "Cadastro criado" : "Cadastro alterado") + ": " + l[NOME[aba]] + ". Aperte Atualizar app para publicar.");
  }

  function excluir(indice) {
    const l = linhas()[indice];
    let msg = "Excluir " + l[NOME[aba]] + "?";
    const doTime = aba === "EQUIPES" ? linhas("ADVERSÁRIOS").filter((a) => chave(a["Adversário"]) === chave(l.Time)) : [];
    if (doTime.length) msg = "Excluir " + l.Time + " e os " + doTime.length + " atletas cadastrados nela?";
    if (!confirm(msg)) return;
    linhas().splice(indice, 1);
    if (doTime.length) rascunho.abas["ADVERSÁRIOS"] = linhas("ADVERSÁRIOS").filter((a) => chave(a["Adversário"]) !== chave(l.Time));
    $("#ficha").close(); salvarRascunho();
    retorno("info", "Cadastro excluído. Aperte Atualizar app para publicar.");
  }

  /* ---------- importação de elenco ---------- */
  function abrirImportacao() {
    const equipe = $("#filtro-equipe").value;
    if (!equipe) { retorno("info", "Escolha primeiro a equipe no filtro para importar o elenco dela."); $("#filtro-equipe").focus(); return; }
    $("#form-importacao").innerHTML = "<h2>Importar elenco — " + esc(equipe) + "</h2>" +
      '<p class="suave" style="margin:6px 0 0">Abra a página da equipe no SofaScore (aba Equipe), selecione a lista de jogadores, copie e cole aqui. Também aceita uma lista com um atleta por linha no formato <code>Nome; Função; Idade; Estatura; Pé</code>.</p>' +
      '<label for="colado">Lista de jogadores</label><textarea id="colado" style="min-height:200px" placeholder="Paulo Sérgio&#10;9&#10;ST&#10;BRA&#10;…"></textarea>' +
      '<p class="retorno info" id="previa">Cole a lista para ver o que será alterado.</p>' +
      '<label style="display:flex;gap:8px;align-items:center;color:var(--texto);font-size:15px"><input type="checkbox" id="remover"> Remover do elenco quem não estiver na lista (só atletas sem análise e sem vídeo)</label>' +
      '<div class="rodape-form"><span class="espaco"></span><button type="button" class="botao contorno" id="cancelar-imp">Cancelar</button><button type="submit" class="botao" id="aplicar" disabled>Aplicar</button></div>';
    let resultado = null;
    const atuais = () => linhas("ADVERSÁRIOS").filter((a) => chave(a["Adversário"]) === chave(equipe));
    $("#colado").oninput = () => {
      const lidos = DIMAS.lerElencoColado(equipe, $("#colado").value);
      resultado = lidos.length ? DIMAS.mesclarElenco(atuais(), lidos) : null;
      $("#aplicar").disabled = !resultado;
      const r = resultado && resultado.relatorio;
      $("#previa").textContent = !resultado ? "Não reconheci jogadores nesse texto." : lidos.length + " jogadores reconhecidos · " + r.novos.length + " novos · " + r.atualizados.length + " já cadastrados" +
        (r.ausentes.length ? "\nNão estão na lista: " + r.ausentes.join(", ") : "");
    };
    $("#cancelar-imp").onclick = () => $("#importacao").close();
    $("#form-importacao").onsubmit = (ev) => {
      ev.preventDefault(); if (!resultado) return;
      let novas = resultado.linhas, removidos = 0;
      if ($("#remover").checked) {
        const fora = new Set(resultado.relatorio.ausentes.map(chave));
        novas = novas.filter((l) => { const sai = fora.has(chave(l.Atleta)) && !l["Análise Individual"] && !l["Ponto forte"] && !l["Ponto vulnerável"] && !l.Video; if (sai) removidos++; return !sai; });
      }
      rascunho.abas["ADVERSÁRIOS"] = linhas("ADVERSÁRIOS").filter((a) => chave(a["Adversário"]) !== chave(equipe)).concat(novas);
      $("#importacao").close(); salvarRascunho();
      retorno("ok", "Elenco de " + equipe + " importado: " + resultado.relatorio.novos.length + " novos, " + resultado.relatorio.atualizados.length + " atualizados" + (removidos ? ", " + removidos + " removidos" : "") + ". Aperte Atualizar app para publicar.");
    };
    $("#importacao").showModal();
  }

  /* ---------- publicação e base online ---------- */
  async function publicar() {
    const botao = $("#publicar");
    if (DIMAS.conectado() && !DIMAS.sessao()) { retorno("info", "Entre com a conta de administrador para publicar na base online."); $("#conexao").scrollIntoView({ behavior: "smooth" }); $("#fb-email").focus(); return; }
    if (vazio(rascunho) && !vazio(publicado)) { retorno("erro", "O cadastro deste navegador está vazio e a base online tem dados. Para não apagar tudo, a publicação foi bloqueada. Recarregue a página para baixar a base."); return; }
    if (vazio(rascunho) && DIMAS.conectado()) { retorno("erro", "Não há nada cadastrado para publicar. Se a base online já tem dados, recarregue a página para baixá-los."); return; }
    const pacote = { publicadoEm: new Date().toISOString(), origem: "painel", abas: copia(rascunho.abas) };
    botao.disabled = true; retorno("info", "Publicando…");
    try {
      if (logado()) { await DIMAS.gravarDoc("publicado", pacote); await DIMAS.gravarDoc("rascunho", rascunho); }
      publicado = pacote; guarda.gravar(CHAVES.dados, JSON.stringify(pacote));
      desenhar();
      retorno("ok", logado() ? "App atualizado em " + dataHora(pacote.publicadoEm) + ". Os aparelhos recebem a nova versão ao abrir o app ou ao tocar em atualizar."
        : "Versão publicada só neste navegador (" + dataHora(pacote.publicadoEm) + "). Conecte a base online abaixo para enviar aos outros aparelhos.");
    } catch (e) { retorno("erro", "Não foi possível publicar: " + e.message); }
    finally { botao.disabled = false; }
  }

  async function entrar() {
    const cfg = { projectId: $("#fb-projeto").value.trim(), apiKey: $("#fb-chave").value.trim() }, email = $("#fb-email").value.trim(), senha = $("#fb-senha").value;
    if (!cfg.projectId || !cfg.apiKey || !email || !senha) { retorno("erro", "Preencha o ID do projeto, a chave de API, o e-mail e a senha."); return; }
    DIMAS.definirFirebase(cfg); retorno("info", "Conectando…");
    try {
      await DIMAS.entrar(email, senha); $("#fb-senha").value = "";
      let msg = "Conectado como " + email + ".";
      if ((await sincronizar(true)) === "vazia") msg += " A base online está vazia: aperte Atualizar app para enviar os dados pela primeira vez.";
      desenhar(); retorno("ok", msg);
    } catch (e) { DIMAS.sair(); desenhar(); retorno("erro", "Não foi possível conectar: " + e.message); }
  }

  function baixar() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ exportadoEm: new Date().toISOString(), abas: rascunho.abas }, null, 1)], { type: "application/json" }));
    a.download = "dimas-adversarios-" + new Date().toISOString().slice(0, 10) + ".json"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function restaurar(arquivo) {
    const leitor = new FileReader();
    leitor.onload = () => {
      try {
        const j = JSON.parse(leitor.result);
        if (!j.abas || !Array.isArray(j.abas["ADVERSÁRIOS"])) throw new Error("formato");
        if (!confirm("Substituir o rascunho atual pela cópia de " + dataHora(j.exportadoEm) + "?")) return;
        rascunho = { abas: j.abas }; ABAS.forEach((a) => { if (!Array.isArray(rascunho.abas[a])) rascunho.abas[a] = []; });
        salvarRascunho(); retorno("ok", "Cópia restaurada no rascunho. Aperte Atualizar app para publicar.");
      } catch (e) { retorno("erro", "Esse arquivo não é uma cópia de segurança do DIMAS."); }
    };
    leitor.readAsText(arquivo);
  }

  /* ---------- eventos ---------- */
  document.querySelectorAll("[data-aba]").forEach((b) => b.addEventListener("click", () => {
    aba = b.dataset.aba; document.querySelectorAll("[data-aba]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); $("#filtro").value = ""; filtroEquipes(); tabela();
  }));
  $("#tabela").addEventListener("click", (ev) => { const tr = ev.target.closest("tr[data-i]"); if (tr) abrirFicha(Number(tr.dataset.i)); });
  $("#filtro").addEventListener("input", tabela);
  $("#filtro-equipe").addEventListener("change", tabela);
  $("#novo").addEventListener("click", () => abrirFicha(null));
  $("#importar").addEventListener("click", abrirImportacao);
  $("#publicar").addEventListener("click", publicar);
  $("#entrar").addEventListener("click", entrar);
  $("#sair").addEventListener("click", () => { DIMAS.sair(); desenhar(); retorno("info", "Você saiu da base online."); });
  $("#baixar").addEventListener("click", baixar);
  $("#restaurar").addEventListener("click", () => $("#arquivo").click());
  $("#arquivo").addEventListener("change", (ev) => { if (ev.target.files[0]) restaurar(ev.target.files[0]); ev.target.value = ""; });
  $("#copiar-regras").addEventListener("click", () => navigator.clipboard.writeText($("#regras").textContent).then(() => retorno("ok", "Regras copiadas. Troque o e-mail de exemplo pelo seu antes de publicar."), () => retorno("erro", "Não consegui copiar; selecione o texto das regras manualmente.")));

  const f = DIMAS.firebase(); $("#fb-projeto").value = f.projectId; $("#fb-chave").value = f.apiKey;
  if (DIMAS.sessao()) $("#fb-email").value = DIMAS.sessao().email;
  desenhar();
  if (logado()) sincronizar(false).then(desenhar).catch((e) => retorno("erro", "Não foi possível ler a base online: " + e.message));
})();

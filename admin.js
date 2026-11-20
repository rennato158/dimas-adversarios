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
      ["Relatório de Adversário", "Relatório do adversário (link do Google Drive)", "texto", "larga"], ["Material de Pré-jogo 1", "Análise em vídeo (link do Google Drive ou YouTube)", "texto", "larga"],
      ["Elenco", "Nome do elenco (deixe vazio para usar o nome da equipe; preencha para ter um elenco próprio nesta competição)", "texto", "larga"]],
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
    const semPendenciaLocal = !pendente(); // este navegador não tem edição própria esperando publicação
    try { publicado = await DIMAS.buscarPublicado(); } catch (e) { if (e.codigo === "PERMISSION_DENIED") throw e; }
    let remoto = null;
    try { remoto = await DIMAS.lerDoc("rascunho", true); } catch (e) { if (e.codigo === "PERMISSION_DENIED") throw e; }
    const online = !vazio(remoto) ? remoto : !vazio(publicado) ? { abas: copia(publicado.abas) } : null;
    if (!online) return "vazia";
    const igual = JSON.stringify(ABAS.map((a) => online.abas[a] || [])) === JSON.stringify(ABAS.map((a) => rascunho.abas[a]));
    if (vazio(rascunho) || (!igual && semPendenciaLocal) || (!igual && perguntar && confirm("Este navegador tem um rascunho diferente da base online. OK para carregar a base online; Cancelar para manter o daqui."))) {
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

  const elencoDe = (e) => (e && (e.Elenco || e.Time)) || "";
  function nomesEquipes() {
    const nomes = linhas("EQUIPES").map(elencoDe).filter(Boolean);
    linhas("ADVERSÁRIOS").forEach((a) => { if (a["Adversário"] && !nomes.some((n) => chave(n) === chave(a["Adversário"]))) nomes.push(a["Adversário"]); });
    return [...new Set(nomes)];
  }
  function filtroEquipes() {
    const sel = $("#filtro-equipe"), atual = sel.value;
    sel.innerHTML = '<option value="">Todas as equipes</option>' + nomesEquipes().map((n) => '<option value="' + esc(n) + '">' + esc(n) + "</option>").join("");
    sel.value = [...sel.options].some((o) => o.value === atual) ? atual : "";
    sel.hidden = aba !== "ADVERSÁRIOS"; ["#importar", "#importar-json", "#modelo-json"].forEach((s) => { $(s).hidden = aba !== "ADVERSÁRIOS"; });
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
      corpo = ({ l, i }) => '<tr data-i="' + i + '"><td>' + esc(l.Time) + "</td><td>" + esc(l["Competição"] || "—") + "</td><td>" + linhas("ADVERSÁRIOS").filter((a) => chave(a["Adversário"]) === chave(elencoDe(l))).length + "</td>" +
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
    const nomes = new Set(d.equipes.map((e) => e.elencoChave)), comElenco = new Set(d.atletas.map((a) => a.equipeChave));
    const exemplos = (l, f) => l.slice(0, 6).map(f).join(", ") + (l.length > 6 ? "…" : "");
    const itens = [];
    const orfas = [...new Set(d.atletas.filter((a) => !nomes.has(a.equipeChave)).map((a) => a.equipe))];
    if (orfas.length) itens.push([orfas.length, "Equipes citadas em atletas mas não cadastradas (o elenco não aparece no app)", orfas.join(", ")]);
    const semComp = d.equipes.filter((e) => !d.competicoes.some((c) => c.id === e.competicaoId));
    if (semComp.length) itens.push([semComp.length, "Equipes sem competição válida (não aparecem no app)", exemplos(semComp, (e) => e.nome)]);
    const semElenco = d.equipes.filter((e) => !comElenco.has(e.elencoChave));
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
    if (!novo && aba === "EQUIPES" && elencoDe(antigo) !== elencoDe(l) && !linhas("EQUIPES").some((x, i) => i !== indice && chave(elencoDe(x)) === chave(elencoDe(antigo)))) linhas("ADVERSÁRIOS").forEach((a) => { if (chave(a["Adversário"]) === chave(elencoDe(antigo))) a["Adversário"] = elencoDe(l); });
    if (!novo && aba === "CAMPEONATOS" && antigo["Competições"] !== l["Competições"]) linhas("EQUIPES").forEach((e) => { if (chave(e["Competição"]) === chave(antigo["Competições"])) e["Competição"] = l["Competições"]; });
    if (novo) linhas().push(l); else linhas()[indice] = l;
    $("#ficha").close(); salvarRascunho();
    retorno("info", (novo ? "Cadastro criado" : "Cadastro alterado") + ": " + l[NOME[aba]] + ". Aperte Atualizar app para publicar.");
  }

  function excluir(indice) {
    const l = linhas()[indice];
    let msg = "Excluir " + l[NOME[aba]] + "?";
    const compartilhado = aba === "EQUIPES" && linhas("EQUIPES").some((x, i) => i !== indice && chave(elencoDe(x)) === chave(elencoDe(l)));
    const doTime = aba === "EQUIPES" && !compartilhado ? linhas("ADVERSÁRIOS").filter((a) => chave(a["Adversário"]) === chave(elencoDe(l))) : [];
    if (doTime.length) msg = "Excluir " + l.Time + " e os " + doTime.length + " atletas cadastrados nela?";
    if (!confirm(msg)) return;
    linhas().splice(indice, 1);
    if (doTime.length) rascunho.abas["ADVERSÁRIOS"] = linhas("ADVERSÁRIOS").filter((a) => chave(a["Adversário"]) !== chave(elencoDe(l)));
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

  /* ---------- importação de arquivo JSON (dados, vídeos e fotos dos atletas) ---------- */
  const ALIAS = {
    Atleta: ["atleta", "nome", "name", "jogador"], "Adversário": ["equipe", "adversario", "time", "team", "clube"], "Competição": ["competicao", "campeonato"],
    "Função": ["funcao", "posicao", "position"], Nascimento: ["nascimento", "datanascimento", "datadenascimento", "birthdate"], Idade: ["idade", "age"],
    Estatura: ["estatura", "altura", "height"], "Pé dominante": ["pedominante", "pe", "foot"], Imagem: ["imagem", "foto", "image", "photo", "fotourl", "imagemurl"],
    Video: ["video", "videos", "linkdovideo", "linkvideo", "videourl"], "Análise Individual": ["analiseindividual", "analise", "caracteristicas", "caracteristicasindividuais"],
    "Ponto forte": ["pontoforte", "pontosfortes", "forte"], "Ponto vulnerável": ["pontovulneravel", "pontosvulneraveis", "vulneravel"],
    "Histórico (site oGol)": ["historicositeogol", "ogol", "historico"], SofaScore: ["sofascore", "sofascoreid", "idsofascore"],
  };
  const semEspaco = (s) => chave(s).replace(/ /g, "");
  function lerItemJson(obj) {
    const mapa = {}; for (const k of Object.keys(obj || {})) mapa[semEspaco(k)] = obj[k];
    const l = {};
    for (const campo of Object.keys(ALIAS)) {
      let v; for (const a of [semEspaco(campo)].concat(ALIAS[campo])) { if (mapa[a] != null && mapa[a] !== "") { v = mapa[a]; break; } }
      if (v == null) continue;
      if (Array.isArray(v)) v = campo === "Video" || campo === "Imagem" ? (typeof v[0] === "object" && v[0] ? v[0].url || v[0].link || "" : v[0] || "") : v.map((x) => String(x).trim()).filter(Boolean).join("\n");
      if (typeof v === "object") v = v.url || v.link || "";
      l[campo] = String(v).trim();
    }
    if (l.Nascimento && /^\d{4}-\d{2}-\d{2}/.test(l.Nascimento)) l.Nascimento = l.Nascimento.slice(8, 10) + "/" + l.Nascimento.slice(5, 7) + "/" + l.Nascimento.slice(0, 4);
    if (l.Estatura) { const n = parseFloat(l.Estatura.replace(",", ".")); l.Estatura = n ? String(n < 3 ? Math.round(n * 100) : Math.round(n)) : ""; }
    if (l.Nascimento && DIMAS.idadeDe(l.Nascimento)) l.Idade = DIMAS.idadeDe(l.Nascimento) + " Anos"; else if (l.Idade && /^\d+$/.test(l.Idade)) l.Idade += " Anos";
    if (l["Função"]) { l["Função"] = DIMAS.FUNCOES.find((f) => chave(f) === chave(l["Função"])) || l["Função"]; l.Ordem = String(DIMAS.ordemDa(l["Função"])); }
    if (l["Pé dominante"]) l["Pé dominante"] = ["Destro", "Canhoto", "Ambidestro"].find((p) => chave(p) === chave(l["Pé dominante"])) || l["Pé dominante"];
    if (l.Imagem && !/^https?:\/\//i.test(l.Imagem) && !/^data:image\//i.test(l.Imagem) && !/^foto:/.test(l.Imagem) && l.Imagem.length > 200) l.Imagem = "data:image/jpeg;base64," + l.Imagem.replace(/\s+/g, "");
    return l;
  }
  /* Aceita: lista de atletas; { equipe, competicao, atletas: [...] }; ou { equipes: [{ equipe, competicao, atletas: [...] }] } */
  function itensDoJson(raiz, equipePadrao) {
    const saida = [];
    const juntar = (lista, eq, comp) => (lista || []).forEach((o) => { const l = lerItemJson(o); if (!l["Adversário"] && eq) l["Adversário"] = eq; if (!l["Competição"] && comp) l["Competição"] = comp; saida.push(l); });
    if (Array.isArray(raiz)) juntar(raiz, equipePadrao, "");
    else if (raiz && Array.isArray(raiz.equipes)) raiz.equipes.forEach((e) => { const c = lerItemJson(e); juntar(e.atletas || e.jogadores || e.elenco, c["Adversário"] || c.Atleta || equipePadrao, c["Competição"] || lerItemJson(raiz)["Competição"] || ""); });
    else if (raiz && (raiz.atletas || raiz.jogadores || raiz.elenco)) { const c = lerItemJson(raiz); juntar(raiz.atletas || raiz.jogadores || raiz.elenco, c["Adversário"] || equipePadrao, c["Competição"] || ""); }
    return saida;
  }
  function resolverElenco(nome, competicao) {
    const eqs = linhas("EQUIPES");
    let m = eqs.filter((e) => chave(elencoDe(e)) === chave(nome));
    if (m.length) return { chave: elencoDe(m[0]) };
    m = eqs.filter((e) => chave(e.Time) === chave(nome));
    if (competicao) { const c = m.filter((e) => chave(e["Competição"]) === chave(competicao)); if (c.length) return { chave: elencoDe(c[0]) }; }
    if (m.length === 1) return { chave: elencoDe(m[0]) };
    if (m.length > 1) return { ambigua: true };
    return { chave: nome, nova: true };
  }
  function acharAtleta(lista, imp) {
    const palavras = (n) => chave(n).split(" ").filter((p) => p.length > 1), contem = (a, b) => a.length && a.every((p) => b.includes(p));
    let alvo = lista.find((l) => (imp.SofaScore && l.SofaScore === imp.SofaScore) || chave(l.Atleta) === chave(imp.Atleta));
    if (!alvo) { const pi = palavras(imp.Atleta); const c = lista.filter((l) => contem(palavras(l.Atleta), pi) || contem(pi, palavras(l.Atleta))); if (c.length === 1) alvo = c[0]; }
    return alvo;
  }
  const reduzirFoto = (dataUri) => new Promise((ok, falha) => {
    const img = new Image();
    img.onload = () => { const m = 200 / Math.max(img.width, img.height), e = Math.min(1, m); const cv = document.createElement("canvas"); cv.width = Math.round(img.width * e); cv.height = Math.round(img.height * e);
      const c = cv.getContext("2d"); c.fillStyle = "#fff"; c.fillRect(0, 0, cv.width, cv.height); c.drawImage(img, 0, 0, cv.width, cv.height); ok(cv.toDataURL("image/jpeg", 0.78)); };
    img.onerror = () => falha(new Error("imagem inválida")); img.src = dataUri;
  });

  function lerArquivoJson(arquivo) {
    const leitor = new FileReader();
    leitor.onload = () => {
      let raiz; try { raiz = JSON.parse(leitor.result); } catch (e) { retorno("erro", "Esse arquivo não é um JSON válido."); return; }
      if (raiz && raiz.abas) { retorno("info", "Esse arquivo é uma cópia de segurança do DIMAS. Use o botão Restaurar cópia."); return; }
      const itens = itensDoJson(raiz, $("#filtro-equipe").value).filter((l) => l.Atleta);
      if (!itens.length) { retorno("erro", "Não encontrei atletas nesse arquivo. Baixe o modelo para ver o formato esperado."); return; }
      abrirPreviaJson(itens, arquivo.name);
    };
    leitor.readAsText(arquivo);
  }

  function abrirPreviaJson(itens, nomeArquivo) {
    const semEquipe = itens.filter((l) => !l["Adversário"]), ambiguas = new Set(), novas = new Map(), porElenco = new Map();
    let novos = 0, atualizados = 0;
    for (const l of itens) {
      if (!l["Adversário"]) continue;
      const r = resolverElenco(l["Adversário"], l["Competição"]);
      if (r.ambigua) { ambiguas.add(l["Adversário"]); continue; }
      if (r.nova) novas.set(r.chave, l["Competição"] || "");
      l._elenco = r.chave;
      if (!porElenco.has(r.chave)) porElenco.set(r.chave, { novos: 0, atualizados: 0 });
      const existe = acharAtleta(linhas("ADVERSÁRIOS").filter((a) => chave(a["Adversário"]) === chave(r.chave)), l);
      if (existe) { porElenco.get(r.chave).atualizados++; atualizados++; } else { porElenco.get(r.chave).novos++; novos++; }
    }
    const validos = itens.filter((l) => l._elenco);
    const embutidas = validos.filter((l) => /^data:image\//i.test(l.Imagem || "")).length, comLink = validos.filter((l) => /^https?:\/\//i.test(l.Imagem || "")).length, videos = validos.filter((l) => l.Video).length;
    const avisos = [];
    if (semEquipe.length) avisos.push(semEquipe.length + " atleta(s) sem equipe no arquivo foram ignorados. Informe \"equipe\" no JSON ou escolha a equipe no filtro antes de importar.");
    if (ambiguas.size) avisos.push("Equipe em mais de uma competição, informe \"competicao\" no JSON: " + [...ambiguas].join(", ") + ".");
    if (novas.size) avisos.push("Equipes novas que serão criadas: " + [...novas.keys()].join(", ") + ".");
    if (embutidas && !logado()) avisos.push("O arquivo tem fotos embutidas. Entre na base online antes de aplicar, para que elas possam ser gravadas.");
    $("#form-importacao").innerHTML = "<h2>Importar JSON</h2>" + '<p class="suave" style="margin:6px 0 0">' + esc(nomeArquivo) + "</p>" +
      '<p class="retorno info" style="display:block">' + esc(validos.length + " atleta(s): " + novos + " novo(s) e " + atualizados + " já cadastrado(s), que terão os campos do arquivo atualizados.\n" +
        "Fotos: " + embutidas + " embutida(s) e " + comLink + " por link · Vídeos: " + videos + "\n" + [...porElenco].map(([k, v]) => k + ": " + v.novos + " novo(s), " + v.atualizados + " atualizado(s)").join("\n")) + "</p>" +
      (avisos.length ? '<p class="retorno erro" style="display:block">' + esc(avisos.join("\n")) + "</p>" : "") +
      '<div class="rodape-form"><span class="espaco"></span><button type="button" class="botao contorno" id="cancelar-json">Cancelar</button><button type="submit" class="botao" id="aplicar-json"' + (validos.length && !(embutidas && !logado()) ? "" : " disabled") + ">Aplicar</button></div>";
    $("#cancelar-json").onclick = () => $("#importacao").close();
    $("#form-importacao").onsubmit = (ev) => { ev.preventDefault(); aplicarJson(validos, novas); };
    $("#importacao").showModal();
  }

  async function aplicarJson(itens, novas) {
    const botao = $("#aplicar-json"); botao.disabled = true; botao.textContent = "Importando…";
    try {
      // 1) fotos embutidas: reduzidas e gravadas num documento por elenco; o atleta guarda só a referência
      const fotos = new Map(); let falhasFoto = 0;
      for (const l of itens) {
        if (!/^data:image\//i.test(l.Imagem || "")) continue;
        try { const mini = await reduzirFoto(l.Imagem); const id = DIMAS.slug(l.Atleta); if (!fotos.has(l._elenco)) fotos.set(l._elenco, {}); fotos.get(l._elenco)[id] = mini; l.Imagem = "foto:" + id; }
        catch (e) { falhasFoto++; delete l.Imagem; }
      }
      for (const [elenco, novasFotos] of fotos) {
        const doc = "fotos-" + DIMAS.slug(elenco); let atual = { fotos: {} };
        try { const d = await DIMAS.lerDoc(doc, true); if (d && d.fotos) atual = d; } catch (e) { if (e.codigo && e.codigo !== "NOT_FOUND") throw e; }
        Object.assign(atual.fotos, novasFotos);
        if (new TextEncoder().encode(JSON.stringify(atual)).length > 950000) throw new Error("As fotos de " + elenco + " passam do limite de armazenamento. Importe menos fotos por equipe.");
        await DIMAS.gravarDoc(doc, atual);
      }
      // 2) equipes novas e atletas
      for (const [nome, comp] of novas) if (!linhas("EQUIPES").some((e) => chave(elencoDe(e)) === chave(nome))) linhas("EQUIPES").push(comp ? { Time: nome, "Competição": comp } : { Time: nome });
      let novos = 0, atualizados = 0;
      for (const l of itens) {
        const campos = {}; for (const k of Object.keys(l)) if (k !== "_elenco" && k !== "Competição" && l[k] !== "") campos[k] = l[k];
        campos["Adversário"] = l._elenco;
        const alvo = acharAtleta(linhas("ADVERSÁRIOS").filter((a) => chave(a["Adversário"]) === chave(l._elenco)), l);
        if (alvo) { const nomeAtual = alvo.Atleta; Object.assign(alvo, campos); alvo.Atleta = nomeAtual; atualizados++; } // mantém o nome já cadastrado
        else { if (!campos["Função"]) { campos["Função"] = "Sem função"; campos.Ordem = "9"; } linhas("ADVERSÁRIOS").push(campos); novos++; }
      }
      $("#importacao").close(); salvarRascunho();
      retorno("ok", "JSON importado: " + novos + " atleta(s) novo(s) e " + atualizados + " atualizado(s)" + (fotos.size ? ", com fotos gravadas em " + fotos.size + " elenco(s)" : "") + (falhasFoto ? ". " + falhasFoto + " foto(s) não puderam ser lidas" : "") + ". Aperte Atualizar app para publicar.");
    } catch (e) { botao.disabled = false; botao.textContent = "Aplicar"; retorno("erro", "A importação falhou: " + e.message); $("#importacao").close(); }
  }

  function baixarModeloJson() {
    const modelo = { equipe: "Nome da equipe (como está no painel)", competicao: "Brasileiro Série B", atletas: [{
      nome: "Nome do atleta", funcao: "Atacante", nascimento: "26/01/2008", estatura: 184, pe: "Destro",
      imagem: "https://drive.google.com/file/d/ID/view  (ou a própria imagem embutida: data:image/jpeg;base64,...)",
      video: "https://youtu.be/ID  (ou link do Google Drive)", caracteristicas: "Texto livre sobre o atleta.",
      pontosFortes: ["Finalização", "Jogo aéreo"], pontosVulneraveis: ["Recomposição defensiva"], ogol: "https://www.ogol.com.br/jogador/..." }] };
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(modelo, null, 2)], { type: "application/json" }));
    a.download = "modelo-atletas-dimas.json"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
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
      desenhar(); carregarAcesso(); retorno("ok", msg);
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

  /* ---------- acesso de leitores ---------- */
  let usuariosAcesso = [];
  function lerListaEmails(texto) {
    const saida = [], vistos = new Set();
    let itens = null;
    try { const j = JSON.parse(texto); itens = Array.isArray(j) ? j : Array.isArray(j.usuarios) ? j.usuarios : null; } catch (e) {}
    if (itens) itens.forEach((o) => { const email = DIMAS.normalizarEmail(typeof o === "string" ? o : o.email || o["e-mail"]); const nome = typeof o === "object" ? String(o.nome || o.name || "").trim() : ""; if (/^\S+@\S+\.\S+$/.test(email) && !vistos.has(email)) { vistos.add(email); saida.push({ email, nome }); } });
    else String(texto || "").split(/\r?\n/).forEach((linha) => {
      const m = linha.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/); if (!m) return;
      const email = DIMAS.normalizarEmail(m[0]); if (vistos.has(email)) return;
      const nome = linha.replace(m[0], "").replace(/[;,\t"<>]+/g, " ").replace(/\s+/g, " ").trim();
      vistos.add(email); saida.push({ email, nome: /^(nome|e-?mail)$/i.test(nome) ? "" : nome });
    });
    return saida;
  }
  function desenharAcesso() {
    const sn = (v) => esc(v || "—");
    $("#tabela-acesso").innerHTML = "<thead><tr><th>Nome</th><th>E-mail</th><th>Liberado em</th><th>Situação</th><th></th></tr></thead><tbody>" +
      (usuariosAcesso.length ? usuariosAcesso.map((u, i) => "<tr><td>" + sn(u.nome) + "</td><td>" + esc(u.email) + "</td><td>" + esc(dataHora(u.convidadoEm)) + "</td><td>" + sn(u.situacao) +
        '</td><td style="text-align:right"><button class="botao contorno pequeno" data-reenviar="' + i + '">Reenviar convite</button> <button class="botao perigo pequeno" data-remover-acesso="' + i + '">Remover</button></td></tr>').join("")
        : '<tr><td colspan="5" class="suave">Nenhum usuário liberado ainda. Você, como administrador, sempre tem acesso.</td></tr>') + "</tbody>";
    $("#resumo-acesso").textContent = usuariosAcesso.length + " usuário(s) com acesso de visualização.";
  }
  async function carregarAcesso() {
    if (!logado()) { $("#tabela-acesso").innerHTML = ""; $("#resumo-acesso").textContent = "Entre na base online para gerenciar o acesso."; return; }
    try { usuariosAcesso = await DIMAS.lerAcesso(); desenharAcesso(); } catch (e) { $("#resumo-acesso").textContent = "Não foi possível ler a lista de acesso: " + e.message; }
  }
  async function convidarLista() {
    if (!logado()) { retorno("info", "Entre na base online para liberar acessos."); $("#conexao").scrollIntoView({ behavior: "smooth" }); return; }
    const novos = lerListaEmails($("#lista-acesso").value);
    if (!novos.length) { retorno("erro", "Não encontrei e-mails na lista."); return; }
    const jaTem = new Set(usuariosAcesso.map((u) => u.email)), adicionar = novos.filter((u) => !jaTem.has(u.email));
    if (!adicionar.length) { retorno("info", "Todos esses e-mails já têm acesso."); return; }
    if (!confirm("Liberar acesso de visualização para " + adicionar.length + " pessoa(s) e enviar o e-mail de criação de senha?")) return;
    const botao = $("#convidar"); botao.disabled = true;
    const falhas = [], existentes = [];
    try {
      for (const [i, u] of adicionar.entries()) {
        botao.textContent = "Convidando " + (i + 1) + " de " + adicionar.length + "…";
        try { const s = await DIMAS.convidar(u.email); if (s === "conta já existia") existentes.push(u.email); usuariosAcesso.push({ email: u.email, nome: u.nome, convidadoEm: new Date().toISOString(), situacao: s }); }
        catch (e) { falhas.push(u.email + " (" + e.message + ")"); }
        await new Promise((r) => setTimeout(r, 400));
      }
      await DIMAS.gravarAcesso(usuariosAcesso);
      $("#lista-acesso").value = ""; desenharAcesso();
      retorno(falhas.length ? "erro" : "ok", (adicionar.length - falhas.length) + " acesso(s) liberado(s) e convite(s) enviado(s)." +
        (existentes.length ? "\nJá tinham conta (confira se são mesmo dessas pessoas): " + existentes.join(", ") : "") + (falhas.length ? "\nFalharam: " + falhas.join("; ") : ""));
    } catch (e) { retorno("erro", "Não foi possível gravar a lista de acesso: " + e.message); }
    finally { botao.disabled = false; botao.textContent = "Liberar acesso e enviar convites"; }
  }
  $("#convidar").addEventListener("click", convidarLista);
  $("#importar-acesso").addEventListener("click", () => $("#arquivo-acesso").click());
  $("#arquivo-acesso").addEventListener("change", (ev) => {
    const f = ev.target.files[0]; ev.target.value = ""; if (!f) return;
    const r = new FileReader(); r.onload = () => { const l = lerListaEmails(r.result); $("#lista-acesso").value = l.map((u) => (u.nome ? u.nome + "; " : "") + u.email).join("\n"); retorno("info", l.length + " e-mail(s) lidos do arquivo. Confira e aperte Liberar acesso e enviar convites."); }; r.readAsText(f);
  });
  $("#tabela-acesso").addEventListener("click", async (ev) => {
    const b = ev.target.closest("[data-reenviar],[data-remover-acesso]"); if (!b) return;
    if (b.dataset.reenviar) {
      const u = usuariosAcesso[Number(b.dataset.reenviar)];
      try { await DIMAS.enviarDefinicaoSenha(u.email); retorno("ok", "Convite reenviado para " + u.email + "."); } catch (e) { retorno("erro", "Não foi possível reenviar: " + e.message); }
    } else {
      const i = Number(b.dataset.removerAcesso), u = usuariosAcesso[i];
      if (!confirm("Remover o acesso de " + u.email + "? A pessoa deixa de ver o app imediatamente.")) return;
      const antes = usuariosAcesso.slice(); usuariosAcesso.splice(i, 1);
      try { await DIMAS.gravarAcesso(usuariosAcesso); desenharAcesso(); retorno("ok", "Acesso de " + u.email + " removido."); }
      catch (e) { usuariosAcesso = antes; retorno("erro", "Não foi possível remover: " + e.message); }
    }
  });

  /* ---------- eventos ---------- */
  document.querySelectorAll("[data-aba]").forEach((b) => b.addEventListener("click", () => {
    aba = b.dataset.aba; document.querySelectorAll("[data-aba]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); $("#filtro").value = ""; filtroEquipes(); tabela();
  }));
  $("#tabela").addEventListener("click", (ev) => { const tr = ev.target.closest("tr[data-i]"); if (tr) abrirFicha(Number(tr.dataset.i)); });
  $("#filtro").addEventListener("input", tabela);
  $("#filtro-equipe").addEventListener("change", tabela);
  $("#novo").addEventListener("click", () => abrirFicha(null));
  $("#importar").addEventListener("click", abrirImportacao);
  $("#importar-json").addEventListener("click", () => $("#arquivo-json").click());
  $("#arquivo-json").addEventListener("change", (ev) => { if (ev.target.files[0]) lerArquivoJson(ev.target.files[0]); ev.target.value = ""; });
  $("#modelo-json").addEventListener("click", baixarModeloJson);
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
  carregarAcesso();
})();

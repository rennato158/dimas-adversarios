/* Núcleo compartilhado entre o app (index.html) e o painel (admin.html):
   base online (Firebase), normalização dos dados, mídia e importação de elencos. */
window.DIMAS = (function () {
  const CHAVES = { dados: "dimas.dados.v2", rascunho: "dimas.rascunho.v2", firebase: "dimas.firebase", sessao: "dimas.sessao" };

  const guarda = {
    ler(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    gravar(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    apagar(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };

  /* ---------- texto ---------- */
  const semAcento = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
  const chave = (s) => semAcento(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const slug = (s) => chave(s).replace(/ /g, "-");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- mídia ---------- */
  function driveId(url) {
    const s = String(url || "");
    if (!/google\.com|googleusercontent\.com/.test(s)) return "";
    const m = s.match(/\/d\/([\w-]{20,})/) || s.match(/[?&]id=([\w-]{20,})/);
    return m ? m[1] : "";
  }
  function youtubeId(url) {
    const m = String(url || "").match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
    return m ? m[1] : "";
  }
  /* Imagem: links do Drive viram miniatura pública; outros links são usados como estão. */
  function imagem(url, largura) {
    const id = driveId(url);
    if (id) return "https://lh3.googleusercontent.com/d/" + id + "=w" + (largura || 400);
    return /^https?:\/\//.test(String(url || "")) ? String(url) : "";
  }
  /* Vídeo ou documento: devolve como tocar/abrir dentro do app. */
  function midia(url) {
    const u = String(url || "").trim();
    if (!u) return null;
    const yt = youtubeId(u);
    if (yt) return { tipo: "youtube", embed: "https://www.youtube-nocookie.com/embed/" + yt + "?rel=0&playsinline=1", externo: u };
    const id = driveId(u);
    if (id) return { tipo: "drive", embed: "https://drive.google.com/file/d/" + id + "/preview", externo: "https://drive.google.com/file/d/" + id + "/view" };
    return /^https?:\/\//.test(u) ? { tipo: "link", embed: "", externo: u } : null;
  }

  /* ---------- funções em campo ---------- */
  const ORDEM = { "Goleiro": 1, "Lateral": 2, "Zagueiro": 3, "Volante": 4, "Meio-campista": 4.5, "Meia": 5, "Extremo": 6, "Atacante": 7 };
  const FUNCOES = Object.keys(ORDEM);
  const ordemDa = (funcao) => { const k = FUNCOES.find((f) => chave(f) === chave(funcao)); return k ? ORDEM[k] : 9; };

  /* ---------- normalização ---------- */
  function leitor(linha) {
    const mapa = {};
    for (const k of Object.keys(linha || {})) mapa[chave(k)] = String(linha[k] == null ? "" : linha[k]).trim();
    return (...nomes) => { for (const n of nomes) { const v = mapa[chave(n)]; if (v) return v; } return ""; };
  }
  function estatura(v) {
    const n = parseFloat(String(v).replace(",", "."));
    if (!n) return { cm: 0, texto: "" };
    const cm = n < 3 ? Math.round(n * 100) : Math.round(n);
    return { cm, texto: (cm / 100).toFixed(2).replace(".", ",") + " m" };
  }
  /* "25/03/1998" -> idade hoje */
  function idadeDe(nascimento) {
    const m = String(nascimento || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return 0;
    const hoje = new Date(); let idade = hoje.getFullYear() - Number(m[3]);
    if (hoje.getMonth() + 1 < Number(m[2]) || (hoje.getMonth() + 1 === Number(m[2]) && hoje.getDate() < Number(m[1]))) idade--;
    return idade > 0 && idade < 70 ? idade : 0;
  }

  function normalizar(pacote) {
    const abas = (pacote && pacote.abas) || {};
    const aba = (...nomes) => { for (const k of Object.keys(abas)) if (nomes.some((n) => chave(n) === chave(k))) return abas[k] || []; return []; };

    const competicoes = aba("CAMPEONATOS", "COMPETIÇÕES").map((l) => {
      const c = leitor(l); const nome = c("Competições", "Competição", "Campeonato");
      return { id: slug(nome), nome, imagem: c("Imagem Competições", "Imagem Competição", "Imagem") };
    }).filter((c) => c.nome);

    const equipes = aba("EQUIPES", "TIMES").map((l) => {
      const c = leitor(l); const nome = c("Time", "Equipe"); const competicao = c("Competição", "Competições");
      return {
        id: slug(competicao) + "--" + slug(nome), nome, competicao, competicaoId: slug(competicao),
        imagem: c("Time Imagem", "Imagem", "Escudo"),
        relatorio: c("Relatório de Adversário", "Relatório adversário", "Relatório"),
        preJogo: c("Material de Pré-jogo 1", "Material de Pré-jogo", "Análise do Adversário", "Vídeo"),
      };
    }).filter((e) => e.nome);

    const atletas = aba("ADVERSÁRIOS", "ATLETAS").map((l, i) => {
      const c = leitor(l); const nome = c("Atleta", "Nome"); const equipe = c("Adversário", "Time", "Equipe");
      const est = estatura(c("Estatura", "Altura"));
      const funcao = c("Função", "Posição") || "Sem função";
      return {
        id: slug(equipe) + "--" + slug(nome), nome, equipe, equipeChave: chave(equipe), funcao,
        idade: idadeDe(c("Nascimento")) || parseInt(c("Idade"), 10) || 0, nascimento: c("Nascimento"),
        estaturaCm: est.cm, estatura: est.texto,
        pe: c("Pé dominante", "Pé"), analise: c("Análise Individual", "Características Individuais"),
        forte: c("Ponto forte", "Pontos Fortes"), vulneravel: c("Ponto vulnerável", "Pontos Vulneráveis"),
        ogol: c("Histórico (site oGol)", "Histórico", "oGol"), video: c("Video", "Vídeo"),
        imagem: c("Imagem", "Foto"), ordem: parseFloat(c("Ordem")) || ordemDa(funcao), linha: i,
      };
    }).filter((a) => a.nome && a.equipe);

    return { publicadoEm: (pacote && pacote.publicadoEm) || "", origem: (pacote && pacote.origem) || "", competicoes, equipes, atletas };
  }

  /* ---------- importação de elencos ---------- */
  const POSICOES = { GK: "Goleiro", DC: "Zagueiro", DL: "Lateral", DR: "Lateral", DM: "Volante", MC: "Meio-campista", AM: "Meia", ML: "Extremo", MR: "Extremo", LW: "Extremo", RW: "Extremo", ST: "Atacante" };
  const POSICAO_GERAL = { G: "Goleiro", D: "Zagueiro", M: "Meio-campista", F: "Atacante" };
  const PES = { Right: "Destro", Left: "Canhoto", Both: "Ambidestro" };
  function funcaoSofa(detalhe, geral) {
    const lista = String(detalhe || "").split("/").filter(Boolean);
    if (lista[0] === "MC") return lista.includes("DM") ? "Volante" : lista.includes("AM") ? "Meia" : "Meio-campista";
    return POSICOES[lista[0]] || POSICAO_GERAL[geral] || "Sem função";
  }
  /* Linha lida do SofaScore -> linha no formato da base */
  function linhaSofa(equipe, r) {
    const [nome, detalhe, geral, altura, nasc, pe, id] = r;
    const d = nasc ? new Date(Number(nasc) * 1000) : null;
    const nascimento = d ? String(d.getUTCDate()).padStart(2, "0") + "/" + String(d.getUTCMonth() + 1).padStart(2, "0") + "/" + d.getUTCFullYear() : "";
    const funcao = funcaoSofa(detalhe, geral);
    return {
      "Adversário": equipe, Atleta: nome, "Função": funcao, Nascimento: nascimento, Idade: idadeDe(nascimento) ? idadeDe(nascimento) + " Anos" : "",
      Estatura: altura ? String(altura) : "", "Pé dominante": PES[pe] || "", "Análise Individual": "", "Ponto forte": "", "Ponto vulnerável": "",
      "Histórico (site oGol)": "", Video: "", Imagem: id ? "https://img.sofascore.com/api/v1/player/" + id + "/image" : "", Ordem: String(ordemDa(funcao)), SofaScore: id ? String(id) : "",
    };
  }
  /* Texto copiado de uma página de elenco (ou lista "Nome; Função; Idade; Estatura; Pé") -> linhas da base */
  function lerElencoColado(equipe, texto) {
    const linhas = String(texto || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const nova = (nome, funcao, idade, altura, pe) => ({
      "Adversário": equipe, Atleta: nome, "Função": funcao, Nascimento: "", Idade: idade ? parseInt(idade, 10) + " Anos" : "", Estatura: altura ? String(estatura(altura).cm || "") : "",
      "Pé dominante": pe || "", "Análise Individual": "", "Ponto forte": "", "Ponto vulnerável": "", "Histórico (site oGol)": "", Video: "", Imagem: "", Ordem: String(ordemDa(funcao)), SofaScore: "",
    });
    const saida = [];
    if (linhas.some((l) => /[;\t]/.test(l))) {
      for (const l of linhas) {
        const p = l.split(/[;\t]/).map((x) => x.trim());
        if (!p[0] || chave(p[0]) === "atleta" || chave(p[0]) === "nome") continue;
        const funcao = FUNCOES.find((f) => chave(f) === chave(p[1])) || POSICOES[(p[1] || "").toUpperCase()] || p[1] || "Sem função";
        saida.push(nova(p[0], funcao, p[2], p[3], p[4]));
      }
      return saida;
    }
    linhas.forEach((l, i) => {
      if (!POSICOES[l]) return;
      let nome = linhas[i - 1] || "";
      if (/^\d{1,3}$/.test(nome)) nome = linhas[i - 2] || "";
      if (nome && !POSICOES[nome] && !/^\d+$/.test(nome)) saida.push(nova(nome, POSICOES[l] === "Meio-campista" ? "Meio-campista" : POSICOES[l]));
    });
    return saida;
  }
  /* Junta um elenco importado ao que já existe para a equipe, sem apagar análises, fotos e vídeos já cadastrados. */
  function mesclarElenco(atuais, importados) {
    const palavras = (n) => chave(n).split(" ").filter((p) => p.length > 1);
    const contem = (a, b) => a.length && a.every((p) => b.includes(p));
    const usados = new Set(); const relatorio = { novos: [], atualizados: [], ausentes: [] };
    const resultado = atuais.map((l) => Object.assign({}, l));
    for (const imp of importados) {
      let alvo = resultado.find((l, i) => !usados.has(i) && ((imp.SofaScore && l.SofaScore === imp.SofaScore) || chave(l.Atleta) === chave(imp.Atleta)));
      if (!alvo) {
        const pi = palavras(imp.Atleta);
        const candidatos = resultado.filter((l, i) => !usados.has(i) && (contem(palavras(l.Atleta), pi) || contem(pi, palavras(l.Atleta))));
        if (candidatos.length === 1) alvo = candidatos[0];
      }
      if (alvo) {
        usados.add(resultado.indexOf(alvo));
        for (const campo of ["Nascimento", "Idade", "Estatura", "Pé dominante", "SofaScore"]) if (imp[campo]) alvo[campo] = imp[campo];
        if (!alvo.Imagem && imp.Imagem) alvo.Imagem = imp.Imagem;
        if (!alvo["Função"] || alvo["Função"] === "Sem função") { alvo["Função"] = imp["Função"]; alvo.Ordem = imp.Ordem; }
        relatorio.atualizados.push(alvo.Atleta);
      } else { resultado.push(imp); usados.add(resultado.length - 1); relatorio.novos.push(imp.Atleta); }
    }
    resultado.forEach((l, i) => { if (!usados.has(i)) relatorio.ausentes.push(l.Atleta); });
    return { linhas: resultado, relatorio };
  }

  /* ---------- base online (Firebase: Firestore + Authentication, via REST) ---------- */
  function firebase() {
    let salvo = {};
    try { salvo = JSON.parse(guarda.ler(CHAVES.firebase) || "{}"); } catch (e) {}
    const cfg = Object.assign({ apiKey: "", projectId: "" }, (window.DIMAS_CONFIG || {}).FIREBASE || {}, salvo);
    return { apiKey: String(cfg.apiKey || "").trim(), projectId: String(cfg.projectId || "").trim() };
  }
  const definirFirebase = (cfg) => (cfg && cfg.apiKey && cfg.projectId ? guarda.gravar(CHAVES.firebase, JSON.stringify(cfg)) : guarda.apagar(CHAVES.firebase));
  const conectado = () => { const f = firebase(); return !!(f.apiKey && f.projectId); };
  const urlDoc = (nome) => { const f = firebase(); return "https://firestore.googleapis.com/v1/projects/" + encodeURIComponent(f.projectId) + "/databases/(default)/documents/dimas/" + nome + "?key=" + encodeURIComponent(f.apiKey); };

  const ERROS = { INVALID_LOGIN_CREDENTIALS: "E-mail ou senha incorretos.", INVALID_PASSWORD: "E-mail ou senha incorretos.", EMAIL_NOT_FOUND: "E-mail ou senha incorretos.", PERMISSION_DENIED: "Sem permissão. Confira as regras do Firestore e o e-mail do administrador.", NOT_FOUND: "Nada publicado ainda.", TOO_MANY_ATTEMPTS_TRY_LATER: "Muitas tentativas. Tente de novo em alguns minutos." };
  async function pedir(url, opcoes) {
    const r = await fetch(url, opcoes);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const cod = (j.error && (j.error.status || j.error.message)) || "HTTP " + r.status; const e = new Error(ERROS[cod] || cod); e.codigo = cod; throw e; }
    return j;
  }
  function sessao() { try { return JSON.parse(localStorage.getItem(CHAVES.sessao) || "null"); } catch (e) { return null; } }
  function guardarSessao(s) { try { s ? localStorage.setItem(CHAVES.sessao, JSON.stringify(s)) : localStorage.removeItem(CHAVES.sessao); } catch (e) {} }
  async function entrar(email, senha) {
    const j = await pedir("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + encodeURIComponent(firebase().apiKey), {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: senha, returnSecureToken: true }),
    });
    guardarSessao({ email: j.email, token: j.idToken, renovar: j.refreshToken, expira: Date.now() + (Number(j.expiresIn) - 60) * 1000 });
    return j.email;
  }
  const sair = () => guardarSessao(null);
  async function token() {
    const s = sessao();
    if (!s) throw new Error("Entre com a conta de administrador.");
    if (Date.now() < s.expira) return s.token;
    const j = await pedir("https://securetoken.googleapis.com/v1/token?key=" + encodeURIComponent(firebase().apiKey), {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=refresh_token&refresh_token=" + encodeURIComponent(s.renovar),
    });
    guardarSessao({ email: s.email, token: j.id_token, renovar: j.refresh_token, expira: Date.now() + (Number(j.expires_in) - 60) * 1000 });
    return j.id_token;
  }
  async function lerDoc(nome, comLogin) {
    const j = await pedir(urlDoc(nome), comLogin ? { headers: { Authorization: "Bearer " + (await token()) } } : { cache: "no-store" });
    const txt = j.fields && j.fields.json && j.fields.json.stringValue;
    if (!txt) throw new Error("Documento vazio.");
    return JSON.parse(txt);
  }
  async function gravarDoc(nome, pacote) {
    await pedir(urlDoc(nome), {
      method: "PATCH", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (await token()) },
      body: JSON.stringify({ fields: { json: { stringValue: JSON.stringify(pacote) }, atualizadoEm: { timestampValue: new Date().toISOString() } } }),
    });
  }

  /* ---------- carga no app ---------- */
  function pacoteLocal() {
    const txt = guarda.ler(CHAVES.dados);
    if (txt) { try { const p = JSON.parse(txt); if (p && p.abas) return p; } catch (e) {} }
    return window.DIMAS_INSTANTANEO || { publicadoEm: "", origem: "vazio", abas: {} };
  }
  async function buscarPublicado() {
    const p = await lerDoc("publicado", !!sessao()); // com login, envia a credencial (funciona com leitura aberta ou restrita)
    if (!p || !p.abas) throw new Error("Resposta inesperada da base.");
    guarda.gravar(CHAVES.dados, JSON.stringify(p));
    return p;
  }

  function dataHora(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d)) return "—";
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) + " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  return {
    CHAVES, guarda, chave, slug, esc, semAcento, driveId, youtubeId, imagem, midia, FUNCOES, ordemDa, idadeDe, normalizar,
    linhaSofa, lerElencoColado, mesclarElenco, firebase, definirFirebase, conectado, entrar, sair, sessao, lerDoc, gravarDoc,
    pacoteLocal, buscarPublicado, dataHora,
  };
})();

(function () {
  const D = (id) => (id ? `https://drive.google.com/file/d/${id}/view?usp=drive_link` : "");
  const ORDEM = { Goleiro: 1, Lateral: 2, Zagueiro: 3, Volante: 4, Meia: 5, Extremo: 6, Atacante: 7 };
  const competicoes = `
Cearense A|1keYJhmDIE6g2xI0M5wFEiwQ5gtWFyVco
Brasileiro Série B|1ISNTFINkpmotTB6l98SUMOAB3_-sV99d
Copa do Brasil|1UHhQzK0EVKw0_4MqKIeC8zxjVi8cgwk6
Copa do Nordeste|1JKf7AO5ShIr4dkl8SaTrIdVeLcUOsZbd`;
  const equipes = `
São Bernardo|1Nk1sihD09m3SVz96cNlvFsgc9bYzdl_K
Ponte Preta|19odoDF-ho-gC0h-8IKYHFijYcwv515UX
Cuiabá|1IK2DFyFjwStbEJG91Lw7CMhxMBrhut-_
Náutico|17HN3l2ZlSAKHsOpPFaIQ4UDQOqF0UBYl
Londrina|1euKZeheUzs9uhRVn4ch0aI9AyLxtqLAR
Vila Nova|1x_LGK0RAexY0gOouKIK4AOELy50WZzcV
Sport|1y59Upip6oxHz-vhu2zZsSG69hHOlR4TF
Atlético GO|1N-ySmOlZp22odYUF6v-Ln4KvYrAhWuIz
Fortaleza|1KkbgaGj7CSHYCZaaD9HWESjpEE9Y_SZ6
G. Novorizontino|1MOUgN99HwCQs0cpJ_Z7JHaQguuXIr8yO
Operário|1s8e2TyxO16tvJYs3ymA6UJ_wgGFwlEfw
Avaí|1xOBJCLRU2nH5CkCP5n0g1VFGXXHKzvsg
Criciúma|1BFQCqaiQX1ZEUihH8y4TsrEgKNwCkSxh
Botafogo SP|1r3QIUAV3ryi-EW05YUYluvuDjzysmMYk
Juventude|14PdH_Z59q_XZpYpP96OO4KgniX-kh5-w
Goiás|1X1lKFnPpw0x5I_1mrvfLtSKdLaq8mETA
Athletic|17P3pm1JM3olMlYVrMUv_Hiwge1uVPj5U
América MG|1ib2yW1qWWLH6NCqloeDa6MhCqAJFYmKQ
CRB|1WC57dVIgAtbBW1BOFGVNEw-IT2ey118i`;
  const elencos = {
    "São Bernardo": `
Goleiro|Júnior Oliveira|36,197,Destro|1jiHZTLR1qlMHMhjxCAwokFO7glFfv52P
Goleiro|Alex Alves|39,189,Destro|15Gst9x2pCEDBO9KeN_ayWnuL9cVv1mSu
Lateral|Pará|30,167,Canhoto|1cyfHiXn382BLyGPnX4sRHQxfLq3-O5b4
Lateral|Mário Sérgio|32,179,Canhoto|1hqzASzMZaKXvoVSTGqXPtzOGPsIs3Yvb
Lateral|Rodrigo Ferreira|31,178,Destro|1YvaOTCDV_alDY4iilmRbz8zcH-8DF9EQ
Zagueiro|Augusto|29,186,Destro|1VTP4HUEvnkHehojcQN1V2cNsxYAlsWD-
Zagueiro|Jemerson|33,184,Destro|1aLtt-DrgqNZLqoDnSgDJ_oIyoE8JAq-e
Zagueiro|Matheus Salustiano|33,182,Destro|1chI7u4eRpsVT_zeJHWdbNMNgptzVbpfj
Zagueiro|Hélder|36,188,Destro|1lzMJGPKEhmkGW58ySvbJr2HRE6jkuAqU
Zagueiro|Wellington Manzoli|25,194,Canhoto|1pSLNOkz-4DbCBa5qpwbf1oFn3h0E9NAg
Zagueiro|Luizão|24,187,Canhoto|1Vnkxt6vQ50VjYC-6BKu_J8vKIkWrTBzy
Volante|Lucas Fernandes|28,175,Destro|1imMXgqFG9W1xxBi0mr3xo32xOsIAYqLH
Volante|Marcão|35,185,Destro|1MGNlWkq8D_CUo1si15MiGwmh2qVwD-uU
Volante|Rodrigo Andrade|29,174,Destro|1HVlXCpNv_gVzQHr7F1R35RmWBt7PrumN
Volante|Romisson|29,178,Destro|1mrATF2UdghkR6Wb31wOnLSEjuLxsDU9J
Volante|Lucas Lima|26,179,Destro|1Wxqud0U8DAxIVcqLobzYRwUrMBjE11-J
Volante|Foguinho|34,180,Destro|1bBKVDbeki5MJlPAMgUBI1zdz_C3L6wRd
Volante|Dudu Miraíma|26,173,Destro|1cFbo5_CLJmQhoZ9JGQfujiSSKOcQSTCM
Meia|Hyoran|33,174,Destro|11gq6CeEWTAz7-eMX0aeA_nXtNR-E1wQU
Meia|Hugo Sanches|32,167,Destro|13RLggqOJf8erd1KcJr4-MFDu1bz4wfSW
Meia|Pedro Vitor|28,177,Canhoto|185aSlqrHzgbKieulm8_RtU2k8R2DDk22
Atacante|Daniel Amorim|36,191,Destro|1_Hdwt3y2SsrIwpqewBcMeJqaPdfGO8Up
Atacante|Pedrinho|26,176,Destro|1SvekhYJswqqoVL9fSL8Rb8CMmEreMKQs
Atacante|Felipe Garcia|35,185,Destro|1Iy0OkOaklGEiUKcyklmCeJwKS0tUNbRI
Atacante|Fabrício Daniel|29,182,Canhoto|1F-TUiyvAUTYxn8-h44U1acy6nYTAE1y7
Atacante|Echaporã|26,169,Destro|1zme6Aq5UN9eTEI2HAPlBicU9SGdMbivy
Atacante|Lucas Rian|26,170,Destro|18kr-JNNGB8hkA_ksLu12Pb39FoSmIqW-
Atacante|Lucas Reis|25,190,Destro|1FbylpZOJ6hrXaLgphlapRdYhScoCGU8k
Atacante|Hwaskar|20,186,Destro|12SUbk9C7RYX5UVSQuiftX4rtf0lz2TBU`,
    "Ponte Preta": `
Goleiro|Vinicius|23,193,Destro|1PcIMLl_MZGkJpIoMKliMMvTufDn59mkY
Goleiro|Guilherme Viana|22,197,Destro|1KspzfMuLv3fYj5UXImhHzk7BJP6FJycU
Lateral|Danilo Barcelos|34,179,Canhoto|1rxohXKmXViZKZtLcLWTLGPghfhQaP7cy
Lateral|Thalys|26,177,Destro|1ZOjFERFUuePOXk7CLDZe9kPiOn9laTdD
Lateral|Diego Porfírio|27,182,Canhoto|1AljhnZRlr2kR34voK9AScu4NzQ_GGZ38
Lateral|Kevyson|22,174,Canhoto|1jWIIJEcfk8JaMb7mWVBHxQsu864RYzGO
Lateral|Julio|19,176,Destro|1ZrlKSCI-BA4sWlAG1HnZ10txSM3JTYHD
Zagueiro|Lucas Cunha|29,186,Destro|1jC0EBqHbiEb3YMNnn-_6uyG-ani1RFBw
Zagueiro|Márcio Silva|25,192,Canhoto|1KgwMYjKiwJfR44v2748HqWJ7cu2zJen3
Zagueiro|Sergio Palacios|21,195,Destro|1rdHvmo3LR-YPKZhqQ8nsMIrhHXPL_juS
Zagueiro|Diego Leão|21,186,Destro|1fbrU7NiTA2Swv-ijgtVh9shvVW7fzuQb
Volante|Rodrigo Souza|38,186,Destro|1QLjc17n3vlXPLccCbLT0-9iM6jPwXLn7
Volante|Léo Gomes|29,181,Destro|1Mpnap5mQRAubP0mW1B6w3u6xyMQBqQBO
Volante|André Lima|26,179,Destro|1_p1Hm2fpCK4x7zNnEDjREiWUggg1LyWJ
Volante|Murilo|27,182,Canhoto|1ukj6geVE0c88uXda-adflujyhEgzAImY
Meia|Élvis|35,175,Ambidestro|1f82P92j96glQWUzQrDu2tCz2KjIx77Nf
Atacante|Baianinho|27,165,Destro|16NJCeb-g2yCytJguFfbzss4Vm9lI2b-e
Atacante|David da Hora|26,179,Destro|1IHt8xsJ5F4ypGuDW7JJ1lMdo0Guk7wd0
Atacante|Brandão|22,191,Destro|
Atacante|João Damião|17,175,Destro|1ghXScrW0fNMSmupf2Hzq0x5lNJdxiXb4`,
    "Cuiabá": `
Goleiro|João Carlos|38,190,Destro|1l2c-8N4q2orX6J4icA1tVEUJhn-Zq4gx
Goleiro|Marcelo Carné|36,188,Destro|15LKwA20PThBOgjlsKAbowv6OOIojAyiK
Lateral|Eric Melo|26,180,Canhoto|1ttolzik5p4vByfEhHTvS4lIe5v8Iw8Eh
Lateral|Igor Inocêncio|28,185,Destro|17cWWCKA0wnwp_tgvQ-NeUU2tzIPL1yL_
Lateral|Lorenzo|19,180,Canhoto|1H9Sb1n84cgms4D5VVLxdM1DpLnZ5hkDF
Lateral|Railan|26,185,Destro|1DV_T15pojChRpujoiWd2VvSflhe3sITr
Zagueiro|Alan Empereur|32,186,Canhoto|1isUGqLnudxCvXLnLEDpan8XF42ArblCg
Zagueiro|João Basso|29,187,Destro|1MWGdMqyxdKkTdWGM4YVk3zhqHoXfwvgH
Zagueiro|Luís Soares|21,191,Destro|1PKaCtRI5recHIJRGfKTS7Nwhp9DCiSb9
Zagueiro|Vitor Mendes|27,186,Destro|1OWv5V68xuR9QcDfrA-4VNi_uPDgb95oz
Volante|Calebe|23,187,Destro|1TPfgySGCDd9EcTc2uGu8gV-AJ91J-Jso
Volante|David Miguel|19,181,Ambidestro|1iUS_T88PvR4K1i03cd10JkGHC5INeX1S
Volante|João Araújo|21,170,Destro|11kurnBGd2XmGrBEdsi7xUlN_s5zMDLIe
Volante|Luiz Otávio|29,174,Destro|1rSuaiGqpQwoV5BReTawg6mlLy2zcg8T6
Volante|Raul|30,177,Destro|1IaHOZ-9TLihM4DEapw85M03TGRSw-GiT
Meia|Pepê|28,177,Destro|11WSOGX93IIgrD3BW0RL0Wq1FDQV8LCWF
Extremo|Gabriel Mineiro|21,179,Destro|1HIUmNVRWU2UQR_lo6vJPys7ifNZ2dLda
Extremo|Jean Dias|35,170,Ambidestro|12gFJockExwSMLvte5B2kcgVT_RgMllvL
Extremo|Marcos Júnior|33,167,Destro|1f7YaaogMS3Vz8Tnd2PCFBaQ0-FsDOMqO
Atacante|Eliel|23,175,Destro|1IqZqqNVBebomfO15Cgu5QE2U5q8pSGjC
Atacante|Fábio Gomes|29,178,Destro|1zJ6DD20jCtIjJ1ZD-FY6gMkBmWERlqBu
Atacante|Kauan Cristtyan|20,178,Destro|1I7bsTpawGFFRkjuC6djuOlges8OpSpQR
Atacante|Mateus Santos|27,176,Canhoto|1zAOg3od4yMgO5SCDnCZASRNz_V7YJXUC
Atacante|Pedro Henrique|29,188,Canhoto|13_2Rf0hy9WvKn8EM8F-yLmzPFuroMg9C
Atacante|Rodrigo Rodrigues|26,178,Destro|1DkqgIbWSqMZsbtbbN1oDy03RfZd3BBmY
Atacante|Vinicius Peixoto|22,194,Canhoto|1rEjkItk0mmXSQ-fDoenSUKx-TI_aTvbX`,
    "América MG": `
Goleiro|Bruno Brígido|35,188,Destro|1WwV9PNOSl93Xi7UbacX-egygxB7zdrwg
Goleiro|Gustavo|33,186,Destro|1pxxMr9vj-52oXhuwdNDmz3pqJXdWXvJ9
Goleiro|William|28,193,Destro|1dD7rFvzs6v3cltAEOxfaem6DcX-SzHHn
Goleiro|Italo Brito|20,190,Destro|1kGRjlzF14ITYLuxivIfcAgVp1Fekepx6
Lateral|Dalbert|32,181,Canhoto|1szICuzWd66hzmAiyazDkOW_Z4wWcOTOU
Lateral|Alex Silva|32,183,Destro|1FcFF8kD1hDOTIA73UAuhUDcsNZlEX5m-
Lateral|Jhonny|24,179,Destro|1713Vh1jX7vVREZc_ckMasu345JVZY59B
Zagueiro|Luca Sosa|32,185,Canhoto|1tfGiSpLq6FKXiv3rG_TsCzogix-byWOs
Zagueiro|Manoel|36,180,Destro|10DPPPbi_UrfXE4V3md8teK29TmBhj58S
Zagueiro|Emerson|31,184,Destro|174IrnIAYbJz3qBtxPEC-cQ0qfyDOrhj_
Zagueiro|Ricardo Silva|33,190,Destro|1nTE2d8-elumZYbwymObLHgNqtMa4Qrnx
Zagueiro|Wesley Marth|26,190,Ambidestro|1w9k_13mm4dNDN_pQfyBHBWWprzk39i9o
Zagueiro|Rafa Barcelos|22,183,Destro|1pDu-wRFeil_aslyQrH6dn7LL84U5zpeK
Volante|Fernando Elizari|35,173,Destro|1sC5Zq5tuVCdHokLIpAyvxHKYjzkfTaAz
Volante|Val Soares|29,176,Destro|1Mw-9rWvzod9WC6O7KycIEvGjyEDFKTQV
Volante|Jorge Jiménez|33,181,Destro|1xNTHH3hX4lkrNy3TJUT14c2GeayyP95M
Volante|Alê|36,184,Destro|1B9JQyHQ9v6pCdper9wupaMv5-OCC7mz_
Volante|Eduardo Person|29,174,Destro|1X5WTz9a3MxQk2CHFZG_3GB4z1U22vyUk
Volante|Yago Souza|20,173,Destro|1wWfD8cPOczoJ7NFW3GJOzCBLhaKVw-sB
Volante|Felipe Amaral|23,174,Destro|1-RQgLl-nI8VZR2E84wxq0AOl8JWXjNVl
Volante|Tobías Ostchega|27,176,Canhoto|1UMQC-pWS9KFjjJhHszvTbX7MlJhAXuJ7
Volante|Gabriel Domingos|25,185,Destro|1onfkvjtXiFX2QbP0_0xdTUsw6yKrDJtE
Volante|Otávio Gonçalves|20,175,Destro|1XXAhxANn3FqtcmLgCa5dAScpGf3rt2or
Meia|Matías Segovia|23,167,Canhoto|1hrsgPdQbUsjvoAFVJB5JyIzBgCEQ6QG5
Meia|Gabriel Barros|24,182,Canhoto|1ceLXDWWlfjTD_Uc8kgh0s_heW4skYq1s
Meia|Thauan Willians|22,182,Canhoto|181oFEP3u5f1uifm-QNawYP1rjkJrO31V
Atacante|Willian|39,171,Destro|1_WAGj0LZtlVpsg7U0XsQN4EQKyootLQJ
Atacante|Guilherme Parede|30,178,Destro|1IhgNi0mZrCoQ3JtET3qxIaTN7SBvsz2e
Atacante|Gonzalo Mastriani|33,180,Canhoto|1koM2toexRSfmSp-NXcyfCq3lTmB86Az3
Atacante|Paulo Victor|25,180,Canhoto|1_MhtoHMbUhgUJeliqGmXtistOLidweKn`,
  };
  const relatorios = { "São Bernardo": "1bRaize84EdwiSyH0BkV8TpkJiqsbb2AX", "Ponte Preta": "1nxj3DGahVmM5gsloiUuD4bsY3L2tfAlc" };
  const preJogo = { "Ponte Preta": "https://youtu.be/6R-yHidxdqA" };
  const analises = {
    "Ponte Preta|Danilo Barcelos":
      "Lateral de origem atuando como zagueiro pelo lado esquerdo. Atleta experiente, com boa rodagem no futebol nacional. Destaca-se pela imposição física, consistência nos duelos defensivos em 1x1 e capacidade de condução por arraste na fase de construção. Apresenta boa qualidade na bola longa, além de contribuir ofensivamente com finalizações e cobranças de falta.",
  };
  const linhas = (t) => t.trim().split("\n").map((l) => l.split("|"));
  const abas = {
    CAMPEONATOS: linhas(competicoes).map(([n, i]) => ({ "Competições": n, "Imagem Competições": D(i) })),
    EQUIPES: linhas(equipes).map(([n, i]) => ({
      Time: n, "Time Imagem": D(i), "Relatório de Adversário": D(relatorios[n]),
      "Material de Pré-jogo 1": preJogo[n] || "", "Competição": "Brasileiro Série B",
    })),
    "ADVERSÁRIOS": [],
      };
  for (const [equipe, texto] of Object.entries(elencos)) {
    for (const [funcao, nome, sub, img] of linhas(texto)) {
      const [idade, estatura, pe] = sub.split(",");
      abas["ADVERSÁRIOS"].push({
        "Adversário": equipe, Atleta: nome, "Função": funcao, Idade: idade + " Anos", Estatura: estatura,
        "Pé dominante": pe, "Análise Individual": analises[equipe + "|" + nome] || "", "Ponto forte": "",
        "Ponto vulnerável": "", "Histórico (site oGol)": "", Video: "", Imagem: D(img), Ordem: String(ORDEM[funcao] || 9),
      });
    }
  }
  // Elencos lidos do SofaScore: atualizam idade, estatura e pe de quem ja existia e acrescentam os demais atletas.
  const SOFA = {
    "sao-bernardo": "São Bernardo", "ponte-preta": "Ponte Preta", "cuiaba": "Cuiabá", "nautico": "Náutico", "londrina": "Londrina",
    "vila-nova": "Vila Nova", "sport-recife": "Sport", "atletico-goianiense": "Atlético GO", "fortaleza": "Fortaleza",
    "novorizontino": "G. Novorizontino", "operario-pr": "Operário", "avai": "Avaí", "criciuma": "Criciúma", "botafogo-sp": "Botafogo SP",
    "juventude": "Juventude", "goias": "Goiás", "athletic-club": "Athletic", "america-mineiro": "América MG", "crb": "CRB",
  };
  const lidos = window.DIMAS_SOFASCORE || {};
  for (const [slug, equipe] of Object.entries(SOFA)) {
    if (!lidos[slug]) continue;
    const daEquipe = abas["ADVERSÁRIOS"].filter((l) => l["Adversário"] === equipe);
    const outros = abas["ADVERSÁRIOS"].filter((l) => l["Adversário"] !== equipe);
    abas["ADVERSÁRIOS"] = outros.concat(DIMAS.mesclarElenco(daEquipe, lidos[slug].map((r) => DIMAS.linhaSofa(equipe, r))).linhas);
  }
  // Instantâneo inicial (cópia do app Glide em 20/11/2026). Usado enquanto a planilha não estiver conectada.
  window.DIMAS_INSTANTANEO = { publicadoEm: "2026-11-20T13:00:00.000Z", origem: "inicial", abas };
})();

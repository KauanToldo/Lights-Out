/* Lights Out: tela limpa (só o jogo) + gaveta de álgebra + modo "códigos" (Hamming 7,4). */
(function () {
  'use strict';
  const L = Lights, Hm = Hamming;
  const $ = id => document.getElementById(id);

  let mode = 'game', n = 5, s = [], moves = 0;
  let showHint = false, hintSet = null, overlay = null, overlayIdx = -1, busy = false, info = null, drawerOpen = false;
  let data = [1, 0, 1, 1], sent = [], recv = [];

  /* =============== JOGO =============== */
  function buildBoard() {
    const b = $('board');
    b.style.gridTemplateColumns = `repeat(${n},1fr)`;
    b.style.gridTemplateRows = `repeat(${n},1fr)`;
    b.innerHTML = '';
    for (let i = 0; i < n * n; i++) {
      const c = document.createElement('button');
      c.className = 'cell'; c.dataset.i = i;
      c.style.setProperty('--i', Math.floor(i / n) + (i % n));
      c.setAttribute('aria-label', `luz ${Math.floor(i / n) + 1},${(i % n) + 1}`);
      b.appendChild(c);
    }
  }

  function setBoard(state) {
    s = state.slice(); moves = 0; showHint = false; hintSet = null; overlay = null; overlayIdx = -1;
    refresh();
  }
  function randomState() { return Array.from({ length: n * n }, () => (Math.random() < 0.5 ? 1 : 0)); }
  function scramble() {
    let t = new Array(n * n).fill(0);
    const k = 8 + Math.floor(Math.random() * 10);
    for (let i = 0; i < k; i++) t = L.press(t, n, Math.floor(Math.random() * n), Math.floor(Math.random() * n));
    if (t.every(v => v === 0)) t = L.press(t, n, 0, 0);
    setBoard(t);
  }
  function genUnsolvable() {
    if (!info || info.nullity === 0) return;
    let t; do { t = randomState(); } while (L.solve(n, t).solvable);
    setBoard(t);
  }

  function refresh() {
    info = L.solve(n, s);
    const lit = s.reduce((a, b) => a + b, 0);
    if (showHint && info.solvable && !busy) hintSet = info.solution;
    $('lit').textContent = lit; $('moves').textContent = moves;

    [...$('board').children].forEach((c, i) => {
      c.classList.toggle('on', !!s[i]);
      c.classList.toggle('hint', !!(showHint && hintSet && hintSet[i]));
      c.classList.toggle('pat', !!(overlay && overlay[i]));
    });
    $('board').classList.toggle('won', lit === 0 && moves > 0);

    const st = $('status');
    if (lit === 0 && moves > 0) { st.className = 'status win'; st.textContent = 'tudo apagado'; }
    else if (!info.solvable) { st.className = 'status bad'; st.textContent = 'este tabuleiro não tem solução. Abra a álgebra para ver o porquê'; }
    else { st.className = 'status'; st.textContent = ''; }

    $('bHint').textContent = showHint ? 'esconder' : 'dica';
    $('bHint').disabled = busy || !info.solvable || lit === 0;
    $('bApply').disabled = busy || !info.solvable || lit === 0;
    if (drawerOpen) renderDrawer();
  }

  $('board').addEventListener('click', e => {
    const c = e.target.closest('.cell'); if (!c || busy) return;
    const i = +c.dataset.i;
    s = L.press(s, n, Math.floor(i / n), i % n); moves++;
    overlay = null; overlayIdx = -1;
    refresh();
  });

  $('bHint').onclick = () => { showHint = !showHint; overlay = null; overlayIdx = -1; if (!showHint) hintSet = null; refresh(); };
  $('bApply').onclick = async () => {
    if (busy || !info || !info.solvable) return;
    busy = true; showHint = true; overlay = null; overlayIdx = -1;
    hintSet = info.solution.slice(); refresh();
    for (let j = 0; j < hintSet.length; j++) {
      if (!hintSet[j]) continue;
      await new Promise(r => setTimeout(r, 450));
      s = L.press(s, n, Math.floor(j / n), j % n); moves++; hintSet[j] = 0;
      refresh();
    }
    busy = false; showHint = false; hintSet = null; refresh();
  };

  $('sizes').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    n = +b.dataset.n; $('sizes').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    buildBoard(); scramble();
  };

  /* =============== CÓDIGOS (Hamming 7,4) =============== */
  function bitCell(v, clickable, i) {
    return `<button class="cell ${v ? 'on' : ''} ${clickable ? '' : 'static'}" ${clickable ? `data-i="${i}"` : 'tabindex="-1"'}><span class="bit">${v}</span></button>`;
  }
  function renderCodes() {
    sent = Hm.encode(data);
    const syn = Hm.syndrome(recv), pos = Hm.position(syn);
    const errs = recv.reduce((a, v, i) => a + (v !== sent[i] ? 1 : 0), 0);

    $('rowData').innerHTML = data.map((v, i) => `<div class="bitwrap">${bitCell(v, true, i).replace('class="cell', 'class="cell dd')}<small>d${i + 1}</small></div>`).join('');
    $('rowSent').innerHTML = sent.map((v, i) => `<div class="bitwrap">${bitCell(v, false, i)}<small class="${Hm.NAMES[i][0] === 'p' ? 'p' : ''}">${Hm.NAMES[i]}</small></div>`).join('');
    $('rowRecv').innerHTML = recv.map((v, i) => `<div class="bitwrap">${bitCell(v, true, i).replace('class="cell', `class="cell rr ${pos === i + 1 ? 'hint' : ''}`)}<small class="${Hm.NAMES[i][0] === 'p' ? 'p' : ''}">${Hm.NAMES[i]}</small></div>`).join('');

    let msg;
    if (pos === 0 && errs === 0) msg = '<em>nenhum erro: a palavra recebida está no núcleo de H</em>';
    else if (pos === 0) msg = `<em class="bad">${errs} erros que se anulam: o código não percebe</em>`;
    else if (errs === 1) msg = `<em>erro no bit ${pos} (${Hm.NAMES[pos - 1]}). Clique em corrigir</em>`;
    else msg = `<em class="bad">houve ${errs} erros: o síndrome aponta o bit ${pos}, mas o código só garante corrigir 1</em>`;
    $('syn').innerHTML = `síndrome <b>${syn.join(' ')}</b> ${pos ? `→ bit <b>${pos}</b>` : ''}${msg}`;
    $('bFix').disabled = pos === 0;
    if (drawerOpen) renderDrawer();
  }
  function newMessage() { data = [0, 1, 2, 3].map(() => (Math.random() < 0.5 ? 1 : 0)); recv = Hm.encode(data); renderCodes(); }
  $('codesView').addEventListener('click', e => {
    const c = e.target.closest('.cell'); if (!c || c.classList.contains('static')) return;
    const i = +c.dataset.i;
    if (c.classList.contains('dd')) { data[i] ^= 1; recv = Hm.encode(data); }   // muda a mensagem: nova transmissão limpa
    else recv[i] ^= 1;                                                         // estraga um bit no "canal"
    renderCodes();
  });
  $('bFix').onclick = () => { recv = Hm.correct(recv); renderCodes(); };

  /* =============== GAVETA DE ÁLGEBRA =============== */
  function drawMatrix(A) {
    const c = $('matA'); if (!c) return;
    const N = A.length, size = 190, px = size / N, dpr = window.devicePixelRatio || 1;
    c.width = c.height = Math.round(size * dpr);
    const g = c.getContext('2d'); g.scale(dpr, dpr);
    g.fillStyle = '#0c0c11'; g.fillRect(0, 0, size, size);
    g.fillStyle = '#5ab8ff';
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (A[i][j]) g.fillRect(j * px, i * px, Math.max(1, px - 0.6), Math.max(1, px - 0.6));
  }

  function renderDrawer() {
    const body = $('drawerBody');
    if (mode === 'codes') {
      body.innerHTML = `
        <h3>o mesmo motor, outro contexto</h3>
        <div class="eq">H · r = 0 <small>(mod 2)</small></div>
        <p>Matriz de verificação do código de Hamming (7,4). A soma é XOR, como no jogo.</p>
        <h3>matriz H</h3>
        <div class="hmat">${Hm.H.map(r => r.join(' ')).join('<br>')}</div>
        <p>Cada coluna é o número da posição em binário. Por isso o síndrome <b>H·r</b> aponta direto o bit trocado.</p>
        <h3>jogo ↔ código</h3>
        <table class="map">
          <tr><td>núcleo de A</td><td>palavras válidas: núcleo de H (16 de 128)</td></tr>
          <tr><td>tem solução</td><td>síndrome = 0, nenhum erro detectado</td></tr>
          <tr><td>teste de paridade sobre os padrões</td><td>cálculo do síndrome</td></tr>
          <tr><td>colunas LD (redundância)</td><td>bits de paridade, que permitem corrigir erros</td></tr>
        </table>
        <h3>onde isso aparece</h3>
        <p>Memória ECC e DDR5, Wi-Fi e 5G (códigos LDPC), RAID 5 e CRC de arquivos. Mesma ideia: álgebra linear sobre {0,1}.</p>`;
      return;
    }
    const N = n * n, frac = 1 / Math.pow(2, info.nullity);
    const mins = info.kernel.map((k, idx) => `<div class="mini ${overlayIdx === idx ? 'sel' : ''}" data-k="${idx}" style="grid-template-columns:repeat(${n},13px)">${k.map(v => `<i class="${v ? 'k' : ''}"></i>`).join('')}</div>`).join('');
    body.innerHTML = `
      <h3>o jogo como equação</h3>
      <div class="eq">A · x = s <small>(mod 2)</small></div>
      <p>x: quais luzes você clica &nbsp;·&nbsp; s: luzes acesas &nbsp;·&nbsp; 1 + 1 = 0</p>
      <div class="stats">
        <div><b>${info.rank}</b><span>posto</span></div>
        <div><b>${info.nullity}</b><span>nulidade</span></div>
        <div><b>${frac >= 1 ? '100%' : (frac * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%'}</b><span>resolvíveis</span></div>
      </div>
      <p>${info.nullity === 0
        ? `Em ${n}×${n}, A é invertível: todo tabuleiro tem solução, e ela é única.`
        : `Em ${n}×${n}, as ${N} colunas de A são LD: só 1 a cada ${Math.pow(2, info.nullity)} tabuleiros tem solução.`}</p>
      <h3>matriz A (${N}×${N})</h3>
      <canvas id="matA"></canvas>
      <p>Coluna j = o que o clique j faz. Azul = 1.</p>
      <h3>padrões silenciosos (núcleo)</h3>
      ${info.kernel.length ? `<div class="minis">${mins}</div><p>Clicar nesses padrões não muda nada: A·k = 0. Toque num para ver no tabuleiro.</p>`
        : '<p>Núcleo = {0}: nenhuma combinação de cliques deixa o tabuleiro igual.</p>'}
      ${info.kernel.length ? `<p>Este tabuleiro tem solução se, sobre cada padrão, há um número <b>par</b> de luzes acesas: ${
        info.parity.map((p, i) => `padrão ${i + 1} <span class="${p ? 'no' : 'ok'}">${p ? 'ímpar' : 'par'}</span>`).join(' · ')}.</p>` : ''}
      <button class="btn" data-act="unsolv" ${info.nullity === 0 ? 'disabled' : ''}>gerar tabuleiro sem solução</button>
      ${info.nullity === 0 ? '<p>Em tamanhos 4×4 e 5×5 existem tabuleiros sem solução.</p>' : ''}
      <details><summary>como é resolvido</summary>
        <p>Gauss-Jordan sobre {0,1}: só XOR de linhas. Posto ${info.rank}${info.nullity ? `, nulidade ${info.nullity}` : ''}.
        ${info.solvable ? `Há ${Math.pow(2, info.nullity)} solução(ões); a mostrada é a de menos cliques (${L.weight(info.solution)}).` : 'Sistema inconsistente: s não está na imagem de A.'}</p>
        <p>Teorema do núcleo e da imagem: ${info.rank} + ${info.nullity} = ${N}.</p>
        <p>Como A é simétrica, Im(A) = Ker(A)<sup>⊥</sup>: por isso o teste de paridade funciona.</p>
      </details>`;
    drawMatrix(info.A);
  }
  $('drawerBody').addEventListener('click', e => {
    const m = e.target.closest('.mini');
    if (m) {
      const i = +m.dataset.k; overlayIdx = overlayIdx === i ? -1 : i; overlay = overlayIdx >= 0 ? info.kernel[i] : null; showHint = false; hintSet = null;
      refresh(); return;
    }
    if (e.target.closest('[data-act="unsolv"]')) genUnsolvable();
  });

  function toggleDrawer(open) {
    drawerOpen = open === undefined ? !drawerOpen : open;
    $('drawer').classList.toggle('open', drawerOpen);
    $('drawer').setAttribute('aria-hidden', String(!drawerOpen));
    if (drawerOpen) renderDrawer();
  }
  $('bAlg').onclick = () => toggleDrawer();
  $('drawerClose').onclick = () => toggleDrawer(false);

  /* =============== MODO =============== */
  function setMode(m) {
    mode = m; overlay = null; overlayIdx = -1;
    document.querySelectorAll('.modes button').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
    $('gameView').hidden = m !== 'game'; $('codesView').hidden = m !== 'codes';
    $('sizes').style.visibility = m === 'game' ? 'visible' : 'hidden';
    document.querySelectorAll('[data-modes]').forEach(b => { b.hidden = !b.dataset.modes.split(' ').includes(m); });
    if (m === 'codes') { $('status').textContent = ''; $('status').className = 'status'; if (!recv.length) recv = Hm.encode(data); renderCodes(); }
    else refresh();
    if (drawerOpen) renderDrawer();
  }
  document.querySelector('.modes').onclick = e => { const b = e.target.closest('button'); if (b) setMode(b.dataset.mode); };
  $('bNew').onclick = () => (mode === 'game' ? scramble() : newMessage());

  /* =============== TECLADO =============== */
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'escape') toggleDrawer(false);
    else if (k === 'a') toggleDrawer();
    else if (k === 'n') $('bNew').click();
    else if (k === 'h' && mode === 'game' && !$('bHint').disabled) $('bHint').click();
  });

  buildBoard();
  scramble();
  setMode('game');
})();

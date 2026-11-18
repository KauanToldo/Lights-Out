/* Lights Out como sistema linear em aritmética binária (módulo 2).
 * Cada clique inverte a luz clicada e as 4 vizinhas. Se x[j] = 1 significa "cliquei na célula j",
 * o efeito total é  A·x  (mod 2), onde A[i][j] = 1 se a célula j afeta a luz i.
 * Para apagar tudo a partir do estado s, queremos  A·x = s  (mod 2). */
(function (root) {
  'use strict';

  // A: N×N com N = n². Simétrica, com 1 na diagonal e nos vizinhos.
  function buildA(n) {
    const N = n * n, A = Array.from({ length: N }, () => new Array(N).fill(0));
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const i = r * n + c;
      A[i][i] = 1;
      if (r > 0) A[i][i - n] = 1;
      if (r < n - 1) A[i][i + n] = 1;
      if (c > 0) A[i][i - 1] = 1;
      if (c < n - 1) A[i][i + 1] = 1;
    }
    return A;
  }

  const mulV = (A, x) => A.map(row => row.reduce((s, a, j) => s ^ (a & x[j]), 0));

  // Gauss-Jordan em GF(2). Devolve posto, nulidade, base do núcleo e (se existir) a solução particular.
  function gf2(A, s) {
    const N = A.length, M = A.map((row, i) => [...row, s[i]]), piv = [];
    let r = 0;
    for (let c = 0; c < N && r < N; c++) {
      let p = -1;
      for (let i = r; i < N; i++) if (M[i][c]) { p = i; break; }
      if (p < 0) continue;
      [M[r], M[p]] = [M[p], M[r]];
      for (let i = 0; i < N; i++) if (i !== r && M[i][c]) for (let k = c; k <= N; k++) M[i][k] ^= M[r][k];
      piv.push(c); r++;
    }
    const rank = r;
    let solvable = true;
    for (let i = rank; i < N; i++) if (M[i][N]) solvable = false;
    const free = [];
    for (let c = 0; c < N; c++) if (!piv.includes(c)) free.push(c);
    const kernel = free.map(f => {
      const v = new Array(N).fill(0); v[f] = 1;
      piv.forEach((pc, i) => { v[pc] = M[i][f]; });
      return v;
    });
    let particular = null;
    if (solvable) { particular = new Array(N).fill(0); piv.forEach((pc, i) => { particular[pc] = M[i][N]; }); }
    return { rank, nullity: N - rank, kernel, solvable, particular };
  }

  const weight = v => v.reduce((a, b) => a + b, 0);

  // Entre todas as soluções (particular + núcleo), escolhe a com menos cliques.
  function minimalSolution(particular, kernel) {
    let best = null;
    for (let mask = 0; mask < (1 << kernel.length); mask++) {
      const x = particular.slice();
      kernel.forEach((k, i) => { if (mask >> i & 1) for (let j = 0; j < x.length; j++) x[j] ^= k[j]; });
      if (!best || weight(x) < weight(best)) best = x;
    }
    return best;
  }

  function solve(n, s) {
    const A = buildA(n), g = gf2(A, s);
    // Como A é simétrica, Im(A) = Ker(A)^⊥: s tem solução ⇔ s·k = 0 (mod 2) para todo k do núcleo.
    const parity = g.kernel.map(k => k.reduce((p, v, j) => p ^ (v & s[j]), 0));
    return { ...g, A, parity, solution: g.solvable ? minimalSolution(g.particular, g.kernel) : null };
  }

  function press(s, n, r, c) {
    const t = s.slice();
    [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < n && cc >= 0 && cc < n) t[rr * n + cc] ^= 1;
    });
    return t;
  }

  function applyPresses(s, n, x) {
    let t = s.slice();
    x.forEach((v, j) => { if (v) t = press(t, n, Math.floor(j / n), j % n); });
    return t;
  }

  const api = { buildA, mulV, gf2, solve, press, applyPresses, weight };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Lights = api;
})(typeof window !== 'undefined' ? window : globalThis);

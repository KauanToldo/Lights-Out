/* Código de Hamming (7,4): a mesma álgebra do Lights Out (matrizes sobre {0,1}, soma = XOR).
 * Posições 1..7 = [p1, p2, d1, p3, d2, d3, d4].
 * H · r (mod 2) é a "síndrome": se for 0, r é palavra válida (r ∈ Ker H); se não, aponta o bit trocado. */
(function (root) {
  'use strict';

  const H = [
    [1, 0, 1, 0, 1, 0, 1],
    [0, 1, 1, 0, 0, 1, 1],
    [0, 0, 0, 1, 1, 1, 1]
  ];
  const NAMES = ['p1', 'p2', 'd1', 'p3', 'd2', 'd3', 'd4'];

  // 4 bits de dados → 7 bits (os bits de paridade são XOR de subconjuntos dos dados)
  const encode = d => [d[0] ^ d[1] ^ d[3], d[0] ^ d[2] ^ d[3], d[0], d[1] ^ d[2] ^ d[3], d[1], d[2], d[3]];

  const syndrome = r => H.map(row => row.reduce((s, h, j) => s ^ (h & r[j]), 0));
  const position = s => s[0] + 2 * s[1] + 4 * s[2];          // 0 = sem erro; 1..7 = posição do bit
  function correct(r) {
    const t = r.slice(), p = position(syndrome(t));
    if (p > 0) t[p - 1] ^= 1;
    return t;
  }
  const decode = r => [r[2], r[4], r[5], r[6]];

  const api = { H, NAMES, encode, syndrome, position, correct, decode };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Hamming = api;
})(typeof window !== 'undefined' ? window : globalThis);

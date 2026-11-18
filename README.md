# Lights Out: como funciona (versão simples)

Este programa é um jogo, mas por trás dele existe só **álgebra linear**. Este texto explica a lógica passo a passo, sem pressa.

Para jogar: dê duplo clique em `index.html`.

---

## 1. O jogo em 1 minuto

- Existe um tabuleiro com luzes, algumas acesas e outras apagadas.
- Quando você clica numa luz, ela **inverte** (acesa vira apagada e vice-versa). As luzes vizinhas (em cima, embaixo, esquerda e direita) também invertem.
- Objetivo: **apagar todas as luzes**.

Parece um quebra-cabeça de tentativa e erro. Mas dá para resolver com uma conta.

---

## 2. A grande ideia: o jogo é uma equação

Vamos usar números em vez de luzes:

- **0** = luz apagada
- **1** = luz acesa

O tabuleiro vira uma lista de números. Num tabuleiro 2×2 com as luzes numeradas assim:

```
0 1
2 3
```

o estado "luzes 0, 1 e 2 acesas" é a lista `s = [1, 1, 1, 0]`.

**Quais cliques eu dou?** Também é uma lista de 0 e 1. Se `x = [1, 0, 0, 0]`, significa "cliquei só na luz 0".

**O que um clique faz?** Cada clique sempre faz a mesma coisa, então dá para guardar isso numa **matriz A**. A coluna `j` da matriz diz quais luzes mudam quando clico na luz `j`. Para o 2×2:

```
      clique 0  1  2  3
luz 0         1  1  1  0
luz 1         1  1  0  1
luz 2         1  0  1  1
luz 3         0  1  1  1
```

Clicar na luz 0 muda as luzes 0, 1 e 2: é exatamente a primeira coluna.

**Juntando tudo:**

```
A · x = s
```

> A matriz **A** descreve o jogo, **x** são os cliques e **s** são as luzes acesas.
> Resolver o jogo é descobrir o **x** que apaga tudo.

É o mesmo tipo de sistema linear que vimos em aula (`A·x = b`).

---

## 3. A única diferença: 1 + 1 = 0

Aqui os números só podem ser 0 ou 1, e a soma funciona assim:

| conta | resultado |
|---|---|
| 0 + 0 | 0 |
| 0 + 1 | 1 |
| 1 + 0 | 1 |
| **1 + 1** | **0** |

Isso faz sentido no jogo: clicar duas vezes na mesma luz **não faz nada** (inverteu, depois inverteu de volta). Por isso:

- cada luz só precisa ser clicada **0 ou 1 vez**;
- a **ordem** dos cliques não importa.

Esse tipo de conta se chama **aritmética módulo 2** (a mesma do XOR nos computadores). Todo o resto da álgebra funciona igual: matriz, vetor, produto, escalonamento.

---

## 4. Como o programa resolve

Ele usa o **escalonamento (Gauss)** da aula, só que com 0 e 1:

1. Monta a matriz A do tamanho do tabuleiro.
2. Escalona as linhas. Para "somar" linhas, usa `1 + 1 = 0`.
3. Lê o resultado: as luzes onde `x = 1` são as que você deve clicar.

Quando existem várias soluções, o programa mostra a que usa **menos cliques**.

**Exemplo:** num 3×3 com todas as luzes acesas, a solução é clicar em 5 luzes: os 4 cantos e o centro (um "X").

Os botões do jogo:
- **dica**: marca com um aro âmbar as luzes que devem ser clicadas;
- **resolver**: clica nelas sozinho, uma por uma.

---

## 5. Por que alguns tabuleiros não têm solução?

Em tamanhos como 4×4 e 5×5, **existem tabuleiros impossíveis**. A álgebra explica o motivo com três ideias da aula.

### Núcleo: os "padrões silenciosos"
São combinações de cliques que **não mudam nada**: `A · k = 0`. É como se os cliques se anulassem entre si.
No 5×5 existem 2 padrões silenciosos independentes (aparecem em rosa na gaveta de álgebra).

### Imagem: o que dá para alcançar
A **imagem** de A é o conjunto de tabuleiros que os cliques conseguem produzir. Um tabuleiro fora dela não tem solução.

### Posto e nulidade: o teorema que une tudo
```
posto + nulidade = quantidade de luzes
```
No 5×5: `23 + 2 = 25`.

Como o posto é 23 e não 25, só `2²³` dos `2²⁵` tabuleiros são alcançáveis. Isso dá **1 a cada 4 (25%)**.

### Como saber se um tabuleiro tem solução?
Regra de paridade: olhe cada padrão silencioso e conte quantas luzes acesas do tabuleiro caem em cima dele. Se o número for **par** para todos os padrões, tem solução. Se der **ímpar** em algum, não tem.

A gaveta de álgebra mostra esse teste, e o botão **"gerar tabuleiro sem solução"** cria um impossível para você ver o "ímpar".

### Tamanhos
| Tabuleiro | Posto | Nulidade | Tem solução |
|---|---|---|---|
| 3×3 | 9 | 0 | sempre (única) |
| 4×4 | 12 | 4 | 1 a cada 16 |
| 5×5 | 23 | 2 | 1 a cada 4 |
| 6×6 | 36 | 0 | sempre (única) |
| 7×7 | 49 | 0 | sempre (única) |

Nulidade 0 significa que A é **invertível**: todo tabuleiro tem solução, e só uma.

---

## 6. A aba "códigos": a mesma ideia fora do jogo

O jogo é uma brincadeira, mas essa mesma matemática (matrizes de 0 e 1) é usada para **detectar e corrigir erros** em dados. O programa mostra o código de **Hamming (7,4)**.

**Como funciona:**
1. Você escolhe **4 bits** de dados.
2. O programa cria **7 bits**: os 4 de dados mais 3 de "paridade" (calculados com somas módulo 2).
3. Você **estraga um bit** clicando nele, como se um erro tivesse acontecido na transmissão.
4. O programa multiplica a palavra recebida pela matriz **H**. O resultado é o **síndrome** (3 números 0 ou 1).
5. O síndrome, lido como número binário, **é a posição do bit errado**.

**Exemplo:** dados `1011` viram `0110011`. Se o bit 3 for trocado, chega `0100011`. O síndrome dá `1 1 0`, que é o número 3. O programa aponta o bit 3 e corrige.

**Ligação com o jogo:**

| No Lights Out | No código de Hamming |
|---|---|
| Padrões silenciosos (núcleo de A) | Palavras válidas (núcleo de H): 16 de 128 |
| Tabuleiro tem solução | Síndrome = 0 (nenhum erro) |
| Teste de paridade | Cálculo do síndrome |
| Colunas dependentes (LD, redundância) | Bits de paridade, que permitem corrigir |

Esse tipo de código é usado em memória ECC, Wi-Fi e 5G (códigos LDPC), RAID e verificação de arquivos (CRC). O Hamming (7,4) é a versão mais simples dessa família.

Atenção: o código só garante corrigir **1 erro**. Se você estragar 2 bits, ele se confunde e a tela avisa.

---

## 7. Onde cada conceito da aula aparece no programa

| Conceito | Onde aparece |
|---|---|
| Matriz e vetor | A matriz A (desenhada na gaveta) e os vetores de cliques e luzes |
| Produto matriz × vetor | `A · x = s` |
| Sistema linear | O jogo inteiro |
| Escalonamento (Gauss) | O botão "resolver" e "dica" |
| Dependência linear (LI/LD) | Em 4×4 e 5×5 as colunas de A são LD |
| Núcleo | Os padrões silenciosos |
| Imagem | O conjunto de tabuleiros que têm solução |
| Posto e nulidade | Os números mostrados na gaveta |
| Matriz inversa | Nos tamanhos com nulidade 0, A é invertível |
| Matriz simétrica | A é simétrica: isso justifica o teste de paridade |

---

## 8. Como usar

**Botões:** dica, resolver, novo e álgebra.
**Teclas:** `H` dica · `N` novo · `A` abre a álgebra · `Esc` fecha.
**Tamanho:** números 3 a 7 no canto superior direito.
**Abas:** "jogo" e "códigos" no topo.

**Roteiro sugerido para mostrar:**
1. Jogue um pouco em 5×5 (a turma entende rápido).
2. Peça a dica e o resolver.
3. Abra a álgebra: mostre `A · x = s`, o posto e a nulidade.
4. Gere um tabuleiro sem solução e mostre o "ímpar".
5. Vá para "códigos" e mostre a mesma ideia corrigindo um erro.

---

## 9. Arquivos

| Arquivo | O que tem |
|---|---|
| `index.html` | A estrutura da página |
| `style.css` | As cores e o visual |
| `lights.js` | A matemática do jogo: matriz A, escalonamento mod 2, núcleo, solução |
| `hamming.js` | A matemática do código de Hamming |
| `app.js` | A tela: tabuleiro, botões, gaveta de álgebra |

Nenhuma biblioteca externa, nem internet, é necessária. A álgebra foi escrita à mão.

---

## 10. Mini-glossário

- **Vetor**: lista de números (aqui, só 0 e 1).
- **Matriz**: tabela de números.
- **Módulo 2**: contas em que `1 + 1 = 0`.
- **Núcleo**: tudo o que a matriz "zera" (`A·k = 0`).
- **Imagem**: tudo o que a matriz consegue produzir.
- **Posto**: tamanho da imagem. Quanto maior, mais coisas alcançáveis.
- **Nulidade**: tamanho do núcleo.
- **Síndrome**: resultado de `H · r`. Se for zero, não há erro. Se não, indica onde está.

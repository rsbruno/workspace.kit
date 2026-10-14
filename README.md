<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark-mode.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/logo-light-mode.svg">
  <img alt="Workspace Kit" src="assets/logo-light-mode.svg" height="92">
</picture>

# Workspace Kit

**Seu ambiente de desenvolvimento em um comando.**

</div>

---

## O que é

CLI interativa que instala e mantém atualizadas as **skills de agentes de IA** (Claude Code e Codex) e as **configurações de editor** (VS Code e Cursor) a partir do repositório [`rsbruno/workspace.config`](https://github.com/rsbruno/workspace.config).

## Como funciona

1. Baixa a versão atual do repositório de config.
2. Instala as skills ou aplica as configs de editor onde você escolher.
3. Registra o que instalou, então `update` reaplica só o que mudou e `remove` desfaz.

## Instalação

Precisa de Node.js. Cada release do GitHub traz o `workspace.tgz` pronto.

**Rodar sem instalar:**

```bash
npx https://github.com/rsbruno/workspace.kit/releases/latest/download/workspace.tgz skills add
```

```bash
pnpm dlx https://github.com/rsbruno/workspace.kit/releases/latest/download/workspace.tgz skills add
```

**Instalar globalmente:**

```bash
npm install -g https://github.com/rsbruno/workspace.kit/releases/latest/download/workspace.tgz
workspace --help
```

## Comandos

Formato: `workspace <grupo> <comando>`. Sem argumentos, a CLI pergunta o que falta.

| Comando | O que faz |
| --- | --- |
| `workspace skills add` | Instala skills |
| `workspace skills list` | Lista as skills instaladas |
| `workspace skills update` | Atualiza as skills |
| `workspace skills remove` | Remove skills |
| `workspace editor add` | Instala configs do editor |
| `workspace editor list` | Lista as configs instaladas |
| `workspace editor update` | Atualiza as configs |
| `workspace editor remove` | Remove e restaura o que havia antes |
| `workspace kit update` (ou `workspace update`) | Atualiza a própria CLI para a última versão |
| `workspace kit version` (ou `workspace version`) | Mostra a versão instalada da CLI (`workspace -v` imprime só o número) |

Flags úteis: `--agent claude|codex`, `--editor vscode|cursor`, `--scope`, `--ref <versão>`, `--force`.

## Desenvolvimento

```bash
bun install
bun run dev skills list
bun run build
```

Contribuições entram por PR com título no formato `tipo: descrição` (por exemplo `feat: add command`). Vulnerabilidades: veja [SECURITY.md](SECURITY.md).

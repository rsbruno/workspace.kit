<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark-mode.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/logo-light-mode.svg">
  <img alt="Workspace Kit" src="assets/logo-light-mode.svg" height="92">
</picture>

# Workspace Kit

**Seu ambiente de desenvolvimento em um comando.**
Instale skills de agentes de IA e configurações de editor a partir de um único repositório Git, mantenha tudo atualizado e desfaça quando quiser.

[Como funciona](#como-funciona) · [Instalação](#instalação) · [Comandos](#comandos) · [Flags](#flags) · [Segurança](#segurança) · [Desenvolvimento](#desenvolvimento)

</div>

---

## O que é

O **Workspace Kit** (`workspace`) é uma CLI interativa que sincroniza duas coisas entre suas máquinas e projetos:

| Grupo | O que instala | Onde instala |
| --- | --- | --- |
| `skills` | Skills para agentes de IA (**Claude Code** e **Codex**) | `.claude/skills` ou `.agents/skills` |
| `editor` | `settings.json`, extensões recomendadas, atalhos e snippets (**VS Code** e **Cursor**) | pasta de usuário do editor ou `.vscode` do projeto |

Tudo vem de **um repositório Git**, que é a fonte da verdade. Por padrão, [`rsbruno/workspace.config`](https://github.com/rsbruno/workspace.config). A CLI guarda um registro local do que instalou, então consegue **atualizar**, **listar** e **remover** sem bagunçar o que você mesmo editou.

## Como funciona

```
 repositório de config (GitHub)
 ┌────────────────────────────┐
 │ .claude/skills/...         │
 │ .vscode/settings.json      │        workspace skills add
 │ .vscode/extensions.json   ─┼──────▶ workspace editor add
 │ .vscode/keybindings.json   │        workspace ... update
 │ .vscode/snippets/          │
 └────────────────────────────┘
              │  baixa o commit exato (SHA)
              ▼
     instala na sua máquina  +  registra no manifest local
```

1. A CLI resolve a `ref` (branch ou tag, padrão `main`) para um **SHA de commit** e baixa exatamente esse commit.
2. Copia as skills ou aplica as configs de editor no destino escolhido.
3. Grava no **manifest** local o que foi instalado, de qual commit e um **hash** do conteúdo.
4. No `update`, compara o hash do repositório com o instalado e só reaplica o que mudou.

## Instalação

O pacote não é publicado no npm. Cada release do GitHub traz o arquivo `workspace.tgz`, já compilado, e o `npx` e o `pnpm dlx` rodam direto dele. Só precisa de Node.js e `tar`.

| Quero... | Use |
| --- | --- |
| Usar de vez em quando, sem instalar nada | [Rodar sem instalar](#rodar-sem-instalar-recomendado) |
| Ter o comando `workspace` sempre à mão | [Instalar globalmente](#instalar-globalmente) |
| Mexer no código da CLI | [A partir do código](#a-partir-do-código) |

### Rodar sem instalar (recomendado)

Baixa a última versão, executa e não deixa nada instalado na máquina.

```bash
# npm
npx https://github.com/rsbruno/workspace.kit/releases/latest/download/workspace.tgz skills add

# pnpm
pnpm dlx https://github.com/rsbruno/workspace.kit/releases/latest/download/workspace.tgz editor add
```

Qualquer comando e flag funcionam depois da URL:

```bash
npx https://github.com/rsbruno/workspace.kit/releases/latest/download/workspace.tgz skills list --agent claude
```

Para fixar uma versão, troque `latest/download` por `download/v1.2.0`.

> Se o `npx` mostrar uma versão antiga depois de uma release nova, ele reaproveitou o cache. Rode `npm cache clean --force` ou use o link com a versão fixa.

### Instalar globalmente

Cria o comando `workspace` no terminal.

```bash
# npm
npm install -g https://github.com/rsbruno/workspace.kit/releases/latest/download/workspace.tgz

# pnpm
pnpm add -g https://github.com/rsbruno/workspace.kit/releases/latest/download/workspace.tgz

workspace --help
```

Atualizar: rode o mesmo comando de instalação de novo. Desinstalar:

```bash
npm uninstall -g workspace
pnpm remove -g workspace
```

### A partir do código

Pré-requisitos: [Bun](https://bun.sh), Node.js e `tar` disponível no sistema (já vem no Linux e no macOS).

```bash
git clone https://github.com/rsbruno/workspace.kit.git
cd workspace.kit
bun install
bun run build
bun link
```

Depois disso o comando `workspace` fica disponível no terminal:

```bash
workspace --help
```

## Comandos

Formato geral: `workspace <grupo> <comando> [nomes...] [flags]`. Sem argumentos, a CLI **pergunta** o que falta de forma interativa.

### `workspace skills`: skills de agentes de IA

| Comando | Alias | O que faz |
| --- | --- | --- |
| `add [nomes...]` | | Instala skills (pergunta escopo e agentes) |
| `list` | `ls` | Lista as skills instaladas, com versão e custo estimado em tokens |
| `update` | | Reinstala as skills que mudaram no repositório |
| `remove [nomes...]` | `rm` | Remove skills instaladas |

```bash
# escolher interativamente
workspace skills add

# instalar skills específicas no projeto atual para o Claude Code
workspace skills add componente pagina --scope project --agent claude

# instalar globalmente (home do usuário) para o Codex
workspace skills add pre-review --scope global --agent codex

# atualizar, forçando se você editou alguma skill localmente
workspace skills update --agent claude --force
```

| Agente | Pasta de skills |
| --- | --- |
| `claude` | `.claude/skills` |
| `codex` | `.agents/skills` |

Escopo `project` usa a pasta atual. `global` usa a sua home.

### `workspace editor`: configurações de editor

| Comando | Alias | O que faz |
| --- | --- | --- |
| `add [itens...]` | | Instala configs (pergunta escopo e editores) |
| `list` | `ls` | Lista as configs instaladas |
| `update` | | Reaplica as configs que mudaram no repositório |
| `remove [itens...]` | `rm` | Remove e **restaura os valores anteriores** |

Itens disponíveis (os que existirem no repositório de config):

| Item | Fonte no repositório | O que faz |
| --- | --- | --- |
| `settings` | `settings.json` | Aplica só as chaves que diferem, preservando as demais, e guarda o valor anterior de cada uma |
| `extensions` | `extensions.json` | Escopo `user`: instala as extensões pelo comando `code`/`cursor` (precisa estar no PATH). Escopo `project`: adiciona em `recommendations` |
| `keybindings` | `keybindings.json` | Atalhos de teclado |
| `snippets` | `snippets/` | Snippets de código |

```bash
# interativo
workspace editor add

# só settings e snippets no VS Code, nível usuário
workspace editor add settings snippets --scope user --editor vscode

# aplicar no projeto (.vscode), sem tocar na configuração global
workspace editor add settings extensions --scope project

# desfazer e voltar ao que existia antes
workspace editor remove settings --editor cursor
```

| Editor | Pasta de usuário (Linux) |
| --- | --- |
| `vscode` | `~/.config/Code/User` |
| `cursor` | `~/.config/Cursor/User` |

No macOS e no Windows a CLI usa `Application Support` e `%APPDATA%` automaticamente.

## Flags

| Flag | Atalho | Valores | Para que serve |
| --- | --- | --- | --- |
| `--agent` | `-a` | `claude`, `codex` | Agente de IA (skills) |
| `--editor` | `-e` | `vscode`, `cursor` | Editor (aceita lista: `vscode,cursor`) |
| `--scope` | `-s` | `project`, `global` (skills) · `user`, `project` (editor) | Onde instalar |
| `--ref` | | branch, tag ou SHA | Qual versão do repositório de config usar |
| `--force` | `-f` | | Sobrescrever mesmo se você editou localmente |
| `--help` | `-h` | | Mostra a ajuda |

## Segurança e proteção dos seus arquivos

- **Backup antes de alterar.** Antes de mexer num arquivo do editor, a CLI copia o original para `backups/` na pasta de estado.
- **Reversível.** `editor remove` restaura os valores anteriores, em vez de só apagar.
- **Respeita suas edições.** `skills update` pula skills que você modificou localmente. Só sobrescreve com `--force`.
- **Pula o que não é dela.** Skills que não foram instaladas pela CLI são ignoradas no update.
- **Commit exato.** A CLI trava o SHA do commit baixado, então a instalação é reprodutível e o registro mostra de onde veio.
- **Sem segredos no código.** O único token usado é o `GITHUB_TOKEN` opcional do **seu** ambiente, para repositórios privados ou limite de requisições da API.

### Variáveis de ambiente

| Variável | Para que serve |
| --- | --- |
| `GITHUB_TOKEN` | Autentica as chamadas ao GitHub (repositório de config privado ou limite de rate) |
| `WORKSPACE_HOME` | Muda a pasta onde a CLI guarda o manifest e os backups |
| `XDG_STATE_HOME` / `XDG_CONFIG_HOME` | Respeitadas no Linux |

### Onde ficam os dados locais

O manifest e os backups ficam em:

| Sistema | Pasta |
| --- | --- |
| Linux | `~/.local/state/workspace` |
| macOS | `~/Library/Application Support/workspace` |
| Windows | `%LOCALAPPDATA%\workspace` |

## Usando outro repositório de config

O repositório de origem é definido no `package.json`:

```json
"config": {
  "repo": "rsbruno/workspace.config",
  "ref": "main",
  "skillsPath": ".claude/skills",
  "vscodePath": ".vscode"
}
```

| Campo | Significado |
| --- | --- |
| `repo` | `dono/repositório` no GitHub |
| `ref` | branch ou tag padrão |
| `skillsPath` | pasta onde as skills ficam no repositório (cada skill tem um `SKILL.md`) |
| `vscodePath` | pasta com `settings.json`, `extensions.json`, `keybindings.json` e `snippets/` |

Dá para trocar a `ref` na hora com `--ref`, sem alterar nada:

```bash
workspace skills add --ref v1.2.0
```

## Desenvolvimento

```bash
bun install
bun run dev skills list     # roda direto do código-fonte
bun run typecheck           # tsc --noEmit
bun run lint:fix            # eslint --fix
bun run format              # prettier --write
bun run build               # gera dist/cli.js
```

Estrutura:

```
src/
├── cli.ts              entrada: parse de flags e roteamento
├── commands/           um arquivo por comando (skills/, editor/)
├── lib/                registro, manifest, paths, perguntas
│   └── editor/         itens (settings, extensions, keybindings, snippets)
├── ui/                 saída no terminal (header, resumo, spinner)
└── utils/              helpers de arquivo e hash
```

### Hooks (Husky)

| Hook | O que roda |
| --- | --- |
| `pre-commit` | `format`, `lint:fix` e `typecheck` |
| `pre-push` | `build` |

## Versionamento e releases

As versões são **automáticas**. Ao fazer merge de um PR na `main`, a Action **Auto Version** lê o título do PR (Conventional Commits) e cria a tag e a GitHub Release, com o `workspace.tgz` anexado:

| Título do PR | Efeito |
| --- | --- |
| `fix: ...` | patch (`1.0.0` → `1.0.1`) |
| `feat: ...` | minor (`1.0.0` → `1.1.0`) |
| `feat!: ...` ou `BREAKING CHANGE:` | major (`1.0.0` → `2.0.0`) |
| `chore:`, `docs:`, `refactor:` | não gera versão |

O check **PR Title** bloqueia o merge se o título estiver fora do padrão.

## Contribuindo

A `main` é protegida: nada entra por push direto. O fluxo é sempre branch → PR → squash merge.

1. Abra o PR com título no padrão `tipo: descrição`.
2. Espere o check `conventional-title` passar.
3. O merge é feito somente por squash.

Vulnerabilidades: veja [SECURITY.md](SECURITY.md) e reporte de forma privada.

---

<div align="center">

Feito por [@rsbruno](https://github.com/rsbruno)

</div>

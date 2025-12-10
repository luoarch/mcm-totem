# Configuração GitHub Actions com Secrets

Este documento explica como configurar o GitHub Actions para build do Docker usando GitHub Secrets.

## 📋 Pré-requisitos

1. Repositório no GitHub
2. Acesso de administrador ao repositório (para configurar secrets)

## 🔐 Configurar GitHub Secrets

### Passo 1: Acessar Secrets

1. No repositório GitHub, vá em **Settings**
2. No menu lateral, clique em **Secrets and variables** → **Actions**
3. Clique em **New repository secret**

### Passo 2: Adicionar Secrets Obrigatórios

Adicione os seguintes secrets (um por um):

| Nome do Secret | Descrição | Exemplo |
|---------------|-----------|---------|
| `VITE_TOTEM_USERNAME` | Usuário do totem | `AUTOAG` |
| `VITE_TOTEM_PASSWORD` | Senha do totem | `sua_senha_aqui` |
| `VITE_TOTEM_EMPRESA` | Código da empresa | `362` |

### Passo 3: Secrets Opcionais

Estes podem ser configurados se necessário:

| Nome do Secret | Descrição | Padrão |
|---------------|-----------|--------|
| `VITE_API_BASE_URL` | URL base da API | `https://gestaosaude.mcinfor-saude.net.br` |
| `VITE_PANEL_WS_URL` | URL do WebSocket para painel | (opcional) |

## 🚀 Workflow GitHub Actions

Crie o arquivo `.github/workflows/docker-build.yml`:

```yaml
name: Docker Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

env:
  IMAGE_NAME: mcm-totem

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: frontend/Dockerfile
          push: false
          tags: ${{ env.IMAGE_NAME }}:${{ github.sha }}
          build-args: |
            VITE_API_BASE_URL=${{ secrets.VITE_API_BASE_URL || 'https://gestaosaude.mcinfor-saude.net.br' }}
            VITE_API_TIMEOUT_MS=10000
            VITE_TOTEM_USERNAME=${{ secrets.VITE_TOTEM_USERNAME }}
            VITE_TOTEM_PASSWORD=${{ secrets.VITE_TOTEM_PASSWORD }}
            VITE_TOTEM_EMPRESA=${{ secrets.VITE_TOTEM_EMPRESA }}
            VITE_PANEL_WS_URL=${{ secrets.VITE_PANEL_WS_URL }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Verify build success
        run: echo "Docker image built successfully"
```

## 🔍 Verificar Configuração

1. Faça commit do workflow no repositório
2. Vá em **Actions** no GitHub
3. O workflow deve aparecer e executar automaticamente em pushes para `main`

## 📝 Notas Importantes

- ✅ Secrets não são expostos em logs do GitHub Actions
- ✅ Secrets estão disponíveis apenas para workflows
- ✅ Credenciais são injetadas apenas no build, não ficam no código-fonte
- ⚠️ As credenciais ainda ficam no bundle JavaScript final (limitação do Vite)

## 🔄 Atualizar Secrets

Para atualizar um secret:

1. Vá em **Settings** → **Secrets and variables** → **Actions**
2. Clique no secret que deseja atualizar
3. Clique em **Update**
4. Digite o novo valor e salve

## 🚢 Push para Registry (Opcional)

Para fazer push da imagem para um registry, adicione ao workflow:

```yaml
      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Push to registry
        uses: docker/build-push-action@v5
        with:
          # ... mesma configuração do build acima ...
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:latest
            ghcr.io/${{ github.repository }}:${{ github.sha }}
```

---

**Última atualização:** 2025-12-04


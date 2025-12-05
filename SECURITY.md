# Segurança - Credenciais e Variáveis de Ambiente

## ⚠️ Importante: Credenciais no Bundle do Cliente

Este aplicativo é uma SPA (Single Page Application) construída com Vite. **Todas as variáveis de ambiente com prefixo `VITE_*` são incluídas no bundle JavaScript final**, tornando-as acessíveis para qualquer pessoa que inspecione o código-fonte do cliente.

### Por que isso acontece?

Vite substitui as variáveis de ambiente `import.meta.env.VITE_*` em **tempo de build**. Isso significa que:

- ✅ Funciona em qualquer ambiente (desenvolvimento, produção)
- ❌ **As credenciais ficam visíveis no código JavaScript compilado**
- ❌ Qualquer pessoa pode inspecionar o bundle e ver as credenciais

### O que está exposto?

As seguintes variáveis são incluídas no bundle:

- `VITE_TOTEM_USERNAME` - Usuário do totem
- `VITE_TOTEM_PASSWORD` - Senha do totem  
- `VITE_TOTEM_EMPRESA` - Código da empresa
- `VITE_API_BASE_URL` - URL da API (público, não sensível)

## ✅ Solução Atual (Recomendada para Kiosk)

Para aplicações kiosk em ambientes controlados, esta abordagem é aceitável se:

1. **O totem está em local físico seguro** (recepção, sem acesso público à máquina)
2. **O bundle não é compartilhado** publicamente
3. **As credenciais são específicas para o totem** (não são credenciais administrativas)

### Boas Práticas Implementadas

- ✅ Tokens de autenticação são armazenados apenas em memória (não em localStorage)
- ✅ Tokens são descartados ao recarregar a página
- ✅ Erros são sanitizados para não expor dados sensíveis
- ✅ Credenciais nunca são commitadas no repositório (`.env` está no `.gitignore`)

## 📝 Como Usar Variáveis de Ambiente

### Desenvolvimento Local

1. Copie o arquivo de exemplo:
```bash
cp frontend/.env.example frontend/.env
```

2. Edite `frontend/.env` com suas credenciais:
```env
VITE_API_BASE_URL=https://gestaosaude.mcinfor-saude.net.br
VITE_API_TIMEOUT_MS=10000
VITE_TOTEM_USERNAME=seu_usuario
VITE_TOTEM_PASSWORD=sua_senha
VITE_TOTEM_EMPRESA=seu_codigo_empresa
VITE_PANEL_WS_URL=wss://panel.example.com
```

3. ⚠️ **NUNCA** commite o arquivo `.env` no repositório

### Docker Build

Para builds Docker, passe as variáveis como build args:

```bash
docker build \
  --build-arg VITE_TOTEM_USERNAME=usuario \
  --build-arg VITE_TOTEM_PASSWORD=senha \
  --build-arg VITE_TOTEM_EMPRESA=codigo \
  -f frontend/Dockerfile .
```

Ou use `docker-compose.yml` com variáveis de ambiente:

```yaml
services:
  frontend:
    build:
      args:
        VITE_TOTEM_USERNAME: ${VITE_TOTEM_USERNAME}
        VITE_TOTEM_PASSWORD: ${VITE_TOTEM_PASSWORD}
        VITE_TOTEM_EMPRESA: ${VITE_TOTEM_EMPRESA}
```

### GitHub Actions / CI/CD

Use GitHub Secrets para armazenar as credenciais de produção.

**📖 Guia Completo:** Veja `GITHUB_SETUP.md` para instruções detalhadas.

**Resumo rápido:**

1. **Configure Secrets no GitHub:**
   - Settings → Secrets and variables → Actions
   - Adicione: `VITE_TOTEM_USERNAME`, `VITE_TOTEM_PASSWORD`, `VITE_TOTEM_EMPRESA`

2. **O workflow usa os secrets automaticamente:**

```yaml
build-args: |
  VITE_TOTEM_USERNAME=${{ secrets.VITE_TOTEM_USERNAME }}
  VITE_TOTEM_PASSWORD=${{ secrets.VITE_TOTEM_PASSWORD }}
  VITE_TOTEM_EMPRESA=${{ secrets.VITE_TOTEM_EMPRESA }}
```

## 🔒 Alternativas Mais Seguras (Futuro)

Se precisar de maior segurança, considere:

### Opção 1: Backend Proxy
Criar um backend que:
- Armazena credenciais no servidor (nunca no cliente)
- Faz autenticação server-side
- Expõe endpoints protegidos para o totem

### Opção 2: Autenticação com Certificados
- Usar certificados digitais em vez de usuário/senha
- Certificados podem ser instalados no totem de forma segura

### Opção 3: Token de Longa Duração
- Gerar um token específico para o totem no servidor
- Token é trocado periodicamente
- Se comprometido, pode ser revogado

## 📋 Checklist de Segurança

Antes de fazer deploy em produção:

- [ ] `.env` está no `.gitignore` e não foi commitado
- [ ] Credenciais são diferentes das credenciais administrativas
- [ ] Totem está em local físico seguro
- [ ] Bundle não será compartilhado publicamente
- [ ] GitHub Secrets configurados (se usar CI/CD)
- [ ] Logs estão sanitizados (✅ já implementado)
- [ ] Tokens são armazenados apenas em memória (✅ já implementado)

## 🔍 Verificando o Bundle

Para verificar se as credenciais estão no bundle:

```bash
# Build do projeto
cd frontend
yarn build

# Procure por credenciais no bundle (NÃO commite isso!)
grep -r "seu_usuario" dist/
grep -r "sua_senha" dist/
```

Se encontrar, **as credenciais estão expostas no bundle**.

## 📚 Referências

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [OWASP Client-Side Security](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**Última atualização:** Após code review de segurança  
**Status:** Documentação das práticas atuais e recomendações futuras


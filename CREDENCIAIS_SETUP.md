# Configuração de Credenciais

## ⚠️ Importante sobre Segurança

As credenciais do totem (`VITE_TOTEM_*`) são incluídas no bundle JavaScript final. Isso significa que qualquer pessoa que inspecionar o código do cliente poderá ver essas credenciais.

**Isso é aceitável para aplicações kiosk em ambientes controlados**, mas requer cuidado. Veja `SECURITY.md` para detalhes completos.

## Configuração Rápida

### 1. Desenvolvimento Local

```bash
# Copie o arquivo de exemplo
cp frontend/.env.example frontend/.env

# Edite frontend/.env com suas credenciais
# NUNCA commite este arquivo!
```

### 2. Docker Build

```bash
# Passe as credenciais como build args
docker build \
  --build-arg VITE_TOTEM_USERNAME=usuario \
  --build-arg VITE_TOTEM_PASSWORD=senha \
  --build-arg VITE_TOTEM_EMPRESA=codigo \
  -f frontend/Dockerfile .
```

### 3. GitHub Actions (CI/CD)

1. **Configure Secrets no GitHub:**
   - Vá em: Settings → Secrets and variables → Actions
   - Adicione os seguintes secrets:
     - `VITE_TOTEM_USERNAME`
     - `VITE_TOTEM_PASSWORD`
     - `VITE_TOTEM_EMPRESA`

2. **Use no workflow:**

```yaml
- name: Build
  run: |
    docker build \
      --build-arg VITE_TOTEM_USERNAME="${{ secrets.VITE_TOTEM_USERNAME }}" \
      --build-arg VITE_TOTEM_PASSWORD="${{ secrets.VITE_TOTEM_PASSWORD }}" \
      --build-arg VITE_TOTEM_EMPRESA="${{ secrets.VITE_TOTEM_EMPRESA }}" \
      -f frontend/Dockerfile .
```

## Variáveis Necessárias

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `VITE_API_BASE_URL` | URL base da API | ✅ |
| `VITE_TOTEM_USERNAME` | Usuário do totem | ✅ |
| `VITE_TOTEM_PASSWORD` | Senha do totem | ✅ |
| `VITE_TOTEM_EMPRESA` | Código da empresa | ✅ |
| `VITE_API_TIMEOUT_MS` | Timeout da API em ms | ❌ (default: 10000) |
| `VITE_PANEL_WS_URL` | URL do WebSocket do painel | ❌ |

## Checklist

- [ ] Arquivo `.env` criado a partir de `.env.example`
- [ ] Credenciais preenchidas no `.env`
- [ ] `.env` está no `.gitignore` (não será commitado)
- [ ] GitHub Secrets configurados (se usar CI/CD)
- [ ] Documentação `SECURITY.md` lida e compreendida

## Próximos Passos

Após configurar as credenciais:

1. Teste localmente com `yarn dev`
2. Build de produção: `yarn build`
3. Verifique que o bundle funciona corretamente
4. Faça deploy seguindo as práticas de segurança documentadas

---

Para mais detalhes sobre segurança, consulte `SECURITY.md`.


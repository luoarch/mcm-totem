# Nota de Segurança - Credenciais de Ambiente

**Data:** 2025-12-04  
**Status:** ✅ INFORMATIVO

## Credenciais no Arquivo Local

O arquivo `frontend/.env` contém credenciais de **teste/desenvolvimento**:

```
VITE_TOTEM_USERNAME=AUTOAG
VITE_TOTEM_PASSWORD=48X920@756
VITE_TOTEM_EMPRESA=362
```

### Status

- ✅ Arquivo `.env` está no `.gitignore` (não commitado)
- ✅ Credenciais são de ambiente de teste
- ✅ Credenciais de produção serão armazenadas no GitHub Secrets

### Configuração de Produção

As credenciais reais devem ser configuradas como GitHub Secrets:

1. Acesse: **Settings → Secrets and variables → Actions**
2. Adicione os secrets:
   - `VITE_TOTEM_USERNAME`
   - `VITE_TOTEM_PASSWORD`
   - `VITE_TOTEM_EMPRESA`

3. Use no workflow de CI/CD conforme documentado em `SECURITY.md`

### Boas Práticas Mantidas

- ✅ Credenciais de teste separadas de produção
- ✅ `.env` no `.gitignore`
- ✅ GitHub Secrets para credenciais reais
- ✅ Documentação de segurança atualizada

---

**Este arquivo pode ser removido quando a configuração de produção estiver completa.**


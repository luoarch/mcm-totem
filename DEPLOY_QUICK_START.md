# 🚀 Deploy Quick Start - MCM Totem

**Guia rápido para DevOps** | Última atualização: 2025-12-04

---

## 📋 Pré-requisitos

- ✅ Docker 20.10+ e Docker Compose v2+
- ✅ Porta 80 disponível (ou configurar proxy reverso)
- ✅ Acesso às credenciais de produção

---

## ⚡ Deploy Rápido (Docker Compose)

### 1. Clone e Prepare

```bash
git clone <repo-url>
cd totem
```

### 2. Configure Variáveis de Ambiente

Crie arquivo `.env` na raiz do projeto:

```bash
# API Configuration
VITE_API_BASE_URL=https://gestaosaude.mcinfor-saude.net.br
VITE_API_TIMEOUT_MS=10000

# Totem Authentication (OBRIGATÓRIO)
VITE_TOTEM_USERNAME=seu_usuario_producao
VITE_TOTEM_PASSWORD=sua_senha_producao
VITE_TOTEM_EMPRESA=seu_codigo_empresa

# Optional: Panel WebSocket
VITE_PANEL_WS_URL=wss://panel.example.com
```

### 3. Build e Deploy

```bash
# Build e iniciar
docker-compose up -d --build

# Ver logs
docker-compose logs -f frontend

# Verificar status
docker-compose ps
```

### 4. Verificar Saúde

```bash
# Healthcheck endpoint
curl http://localhost:80/health

# Ou no navegador
open http://localhost
```

---

## 🔨 Build Manual (Docker)

### Build da Imagem

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://gestaosaude.mcinfor-saude.net.br \
  --build-arg VITE_API_TIMEOUT_MS=10000 \
  --build-arg VITE_TOTEM_USERNAME=seu_usuario \
  --build-arg VITE_TOTEM_PASSWORD=sua_senha \
  --build-arg VITE_TOTEM_EMPRESA=seu_codigo \
  --build-arg VITE_PANEL_WS_URL=wss://panel.example.com \
  -t mcm-totem:latest \
  -f frontend/Dockerfile .
```

### Executar Container

```bash
docker run -d \
  --name mcm-totem \
  --restart unless-stopped \
  -p 80:8080 \
  mcm-totem:latest
```

---

## 🏭 Deploy em Produção

### Opção 1: Docker Compose (Recomendado)

```bash
# 1. Copiar arquivos para servidor
scp -r totem/ user@server:/opt/mcm-totem/

# 2. SSH no servidor
ssh user@server
cd /opt/mcm-totem

# 3. Configurar .env com credenciais de produção
nano .env  # ou vim .env

# 4. Deploy
docker-compose up -d --build

# 5. Verificar
docker-compose logs -f
curl http://localhost/health
```

### Opção 2: Via GitHub Actions (CI/CD)

1. Configure GitHub Secrets (veja `GITHUB_SETUP.md`)
2. Push para branch `main`
3. Workflow faz build automaticamente
4. Pull da imagem do registry

```bash
# Após build no GitHub Actions
docker pull ghcr.io/<org>/mcm-totem:latest
docker run -d -p 80:8080 --name mcm-totem ghcr.io/<org>/mcm-totem:latest
```

---

## 🔍 Verificação e Troubleshooting

### Status do Container

```bash
# Status
docker-compose ps

# Logs em tempo real
docker-compose logs -f frontend

# Últimas 100 linhas
docker-compose logs --tail=100 frontend

# Entrar no container (debug)
docker-compose exec frontend sh
```

### Health Check

```bash
# Endpoint de saúde
curl -v http://localhost/health

# Verificar resposta
# Deve retornar: "healthy" com HTTP 200
```

### Verificar Portas

```bash
# Ver portas em uso
netstat -tuln | grep :80
# ou
ss -tuln | grep :80

# Ver processo usando porta 80
sudo lsof -i :80
```

### Verificar Build

```bash
# Ver imagens
docker images | grep mcm-totem

# Inspecionar imagem
docker inspect mcm-totem:latest

# Verificar variáveis de ambiente no build
docker run --rm mcm-totem:latest env | grep VITE
```

---

## 🔧 Configurações Importantes

### Portas

- **Container interno:** 8080 (nginx)
- **Host exposto:** 80 (configurável no docker-compose.yml)
- **Healthcheck:** `http://localhost:8080/health`

### Recursos

- **Memória recomendada:** 512MB mínimo
- **CPU:** 1 core mínimo
- **Disco:** ~200MB (imagem)

### Variáveis Obrigatórias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `VITE_TOTEM_USERNAME` | ✅ Obrigatório | `AUTOAG` |
| `VITE_TOTEM_PASSWORD` | ✅ Obrigatório | `senha123` |
| `VITE_TOTEM_EMPRESA` | ✅ Obrigatório | `362` |
| `VITE_API_BASE_URL` | Opcional (tem default) | URL da API |
| `VITE_PANEL_WS_URL` | Opcional | URL WebSocket |

---

## 🔄 Atualização/Redeploy

### Atualizar Aplicação

```bash
# Parar container atual
docker-compose down

# Atualizar código
git pull

# Rebuild e iniciar
docker-compose up -d --build

# Verificar
docker-compose logs -f frontend
```

### Rollback Rápido

```bash
# Parar container atual
docker-compose down

# Usar imagem anterior (exemplo)
docker run -d \
  --name mcm-totem-backup \
  -p 80:8080 \
  mcm-totem:backup-tag

# Ou restaurar do compose anterior
docker-compose -f docker-compose.backup.yml up -d
```

---

## 🛡️ Segurança

### Firewall

```bash
# Permitir apenas porta 80
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp  # se usar HTTPS
```

### Proxy Reverso (Nginx/Apache)

```nginx
# Exemplo Nginx como proxy
server {
    listen 80;
    server_name totem.exemplo.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### HTTPS/SSL

Use Let's Encrypt ou certificado próprio no proxy reverso:

```bash
# Com certbot (Let's Encrypt)
sudo certbot --nginx -d totem.exemplo.com
```

---

## 📊 Monitoramento

### Logs Persistentes

```yaml
# Adicionar ao docker-compose.yml
services:
  frontend:
    volumes:
      - ./logs:/var/log/nginx
```

### Health Check Script

```bash
#!/bin/bash
# healthcheck.sh

if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Totem is healthy"
    exit 0
else
    echo "❌ Totem is down"
    # Reiniciar container
    docker-compose restart frontend
    exit 1
fi
```

Adicionar ao cron:

```bash
# Verificar a cada 5 minutos
*/5 * * * * /opt/mcm-totem/healthcheck.sh
```

---

## 🚨 Troubleshooting Comum

### Container não inicia

```bash
# Ver logs de erro
docker-compose logs frontend

# Verificar se porta está livre
sudo lsof -i :80

# Verificar permissões
ls -la /opt/mcm-totem/
```

### Aplicação não carrega

1. Verificar logs: `docker-compose logs -f frontend`
2. Verificar health: `curl http://localhost/health`
3. Verificar build: `docker-compose build --no-cache`
4. Verificar variáveis: `docker-compose config`

### Erro de autenticação

1. Verificar credenciais no `.env`
2. Verificar se secrets estão corretos no GitHub
3. Verificar logs para mensagens de erro da API

### Porta 80 já em uso

```bash
# Opção 1: Mudar porta no docker-compose.yml
ports:
  - "8080:8080"  # Usar porta 8080 no host

# Opção 2: Parar serviço usando porta 80
sudo systemctl stop nginx  # ou apache2
```

---

## 📝 Checklist de Deploy

- [ ] Credenciais de produção configuradas
- [ ] Porta 80 disponível ou proxy configurado
- [ ] Docker e Docker Compose instalados
- [ ] Arquivo `.env` criado com variáveis corretas
- [ ] Build executado com sucesso
- [ ] Health check respondendo (`/health`)
- [ ] Aplicação acessível no navegador
- [ ] Logs não mostram erros
- [ ] Firewall/configurações de segurança aplicadas
- [ ] Monitoramento/configurado (opcional)

---

## 🔗 Links Úteis

- **Documentação de Segurança:** `SECURITY.md`
- **Configuração GitHub Actions:** `GITHUB_SETUP.md`
- **Resumo de Configurações:** `DOCKER_SETUP_SUMMARY.md`

---

## 💡 Comandos Rápidos

```bash
# Build
docker-compose build

# Iniciar
docker-compose up -d

# Parar
docker-compose down

# Restart
docker-compose restart

# Logs
docker-compose logs -f

# Status
docker-compose ps

# Health
curl http://localhost/health

# Shell no container
docker-compose exec frontend sh

# Limpar tudo (cuidado!)
docker-compose down -v
docker system prune -a
```

---

**Suporte:** Em caso de problemas, consulte os logs ou documentação completa em `SECURITY.md`


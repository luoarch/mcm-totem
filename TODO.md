# TODO — Conformidade com MC AutoAtendimento

## 1. Autenticação (`/login/externo`)
- [ ] Implementar chamada `POST /login/externo` usando `application/x-www-form-urlencoded` com campos `empresa`, `username`, `password`, `integracaowhatsapp`.
- [ ] Persistir `codacesso`/`token` no serviço de sessão e reaproveitar até expirar.
- [ ] Garantir que nenhum log exponha credenciais ou token.

## 2. Busca de paciente (`/pacientesautoage`)
- [ ] Ajustar serviço para enviar `cpf`, `nasci` (`DD/MM/AAAA`), `nome` (primeiro nome), `integracaowhatsapp=S`, `autoagendamento=true`, `celular` opcional.
- [ ] Normalizar inputs (CPF 11 dígitos, data formatada, nome apenas primeiro).
- [ ] Ordenar resposta por `nropaciente desc` e selecionar o primeiro antes de continuar.
- [ ] Exibir fluxo alternativo (criação) quando a resposta vier vazia.

## 3. Criação de paciente (`POST /pacientesautoage`)
- [ ] Solicitar convênio antes da criação e usar `convenio` (código) no payload.
- [ ] Enviar `cpf`, `nome` completo, `nasci` em `ddmmyyyy`, `celular`, `integracaowhatsapp=S`.
- [ ] Tratar resposta: quando `ok === true`, salvar `nropac` como `patientId`; mostrar erro amigável caso contrário.

## 4. Listagem de convênios (`GET /convenios`)
- [ ] Trocar endpoint de mock por `GET /convenios` com params `permiteagweb=S`, `integracaowhatsapp=S`, `codempresa=<codacesso>`.
- [ ] Persistir `convenioCode` selecionado e exibir `nomefantasia` (fallback `razaosocial`).
- [ ] Implementar busca/paginação na UI para listas grandes.

## 5. Listagem de especialidades (`GET /especialidades`)
- [ ] Integrar com `GET /especialidades` usando os mesmos params `permiteagweb`, `integracaowhatsapp`, `codempresa`.
- [ ] Salvar `especialidadeCode` escolhido para uso posterior.

## 6. Geração de atendimento (`POST /atendimentoboletim`)
- [ ] Enviar `autoagendamento=true`, `especialidade=especialidadeCode`, `convenio=convenioCode`, `nropaciente=patientId`, `tipo=e`, `integracaowhatsapp=S` via `application/x-www-form-urlencoded`.
- [ ] Considerar sucesso somente quando HTTP 200 e `type === "success"`, exibindo confirmação na UI.
- [ ] Tratar falhas com mensagem clara e opção de tentar novamente / acionar suporte.

## 7. UX & Fluxo
- [ ] Reforçar máscaras/validações de CPF, celular (E.164), nome e datas nos formulários.
- [ ] Garantir fallback anunciado: se token expirar (401/403), refazer login automaticamente e repetir a requisição original.
- [ ] Documentar métricas/telemetria mínimas para identificar erros de integração no totem.

## 8. Configuração / DevEx
- [ ] Variáveis `.env` para `VITE_API_BASE_URL`, credenciais do totem e código da empresa.
- [ ] Scripts de teste/manual (ex.: coleção Postman incluída) alinhados ao fluxo real.
- [ ] Revisar mocks: limitar uso apenas em ambiente de desenvolvimento com flag explícita, evitando dados fictícios em produção.


# MC AutoAtendimento (Totem) – Documento de Requisitos + API (v1)

## Objetivo e Escopo

Permitir que o Totem execute o fluxo completo de **autoatendimento**: (1) login, (2) busca/criação de paciente, (3) seleção de convênio, (4) seleção de especialidade e (5) geração do atendimento (boletim). Não há gestão de fila, senhas ou códigos de espera — a jornada termina na criação do atendimento.

## Ambiente

- Base URL: `https://gestaosaude.mcinfor-saude.net.br`
- Todas as chamadas autenticadas exigem `Authorization: Bearer <TOKEN>` obtido via login.
- Ferramentas locais: `zsh` (shell padrão) e Node.js `>= 24`.
- `Content-Type`:
  - `application/x-www-form-urlencoded` para POST.
  - Query params para GET.

## Regras de Validação do Totem

- **CPF**: 11 dígitos numéricos (aplicar mascaramento apenas na UI).
- **Celular**: apenas dígitos; preferir formato E.164 (`55DDDNUMERO`).
- **Nome**:
  - Busca: primeiro nome.
  - Criação: nome completo.
- **Data de nascimento**:
  - Busca: `DD/MM/AAAA`.
  - Criação: `ddmmyyyy`.
- Ao receber múltiplos pacientes para o mesmo CPF, ordenar por `nropaciente desc` e selecionar o primeiro.

## Fluxo Completo

1. **Login** (`POST /login/externo`)
   - Body: `empresa`, `username`, `password`, `integracaowhatsapp=S`.
   - Resposta contém `token` (JWT). Persistir durante a sessão e nunca logar sensíveis.
2. **Buscar paciente** (`GET /pacientesautoage`)
   - Params obrigatórios: `integracaowhatsapp=S`, `cpf`, `nasci`, `nome`.
   - Recomendado: `autoagendamento=true`; opcional `celular`.
   - Se lista vazia → seguir para convênios e criação.
3. **Listar convênios** (`GET /convenios`)
   - Params: `permiteagweb=S`, `integracaowhatsapp=S`, `codempresa` (usar `codacesso` do login ou valor acordado).
   - Mostrar `nomefantasia` (fallback `razaosocial`). Salvar `convenioCode`.
4. **Criar paciente** (`POST /pacientesautoage`) – somente se etapa 2 não encontrou paciente.
   - Body: `cpf`, `nome`, `nasci`, `celular`, `convenio=convenioCode`, `integracaowhatsapp=S`.
   - Sucesso (`ok=true`) retorna `nropac` → `patientId`.
5. **Listar especialidades** (`GET /especialidades`)
   - Params: `permiteagweb=S`, `integracaowhatsapp=S`, `codempresa`.
   - Exibir `descricao`; salvar `especialidadeCode`.
6. **Gerar atendimento** (`POST /atendimentoboletim`)
   - Body: `autoagendamento=true`, `especialidade=especialidadeCode`, `convenio=convenioCode`, `nropaciente=patientId`, `tipo=e`, `integracaowhatsapp=S`.
   - Considerar sucesso quando `type === "success"` e HTTP 200.

### Pseudocódigo

```ts
const token = login()
const pacientes = buscarPaciente({ cpf, nasci_dd_mm_yyyy, primeiroNome }, token)

const convenios = listarConvenios(token)
const convenioCode = userSelect(convenios, 'nomefantasia').convenio

const patientId = pacientes.length
  ? pacientes.sort((a, b) => b.nropaciente - a.nropaciente)[0].nropaciente
  : criarPaciente({ cpf, nomeCompleto, nasci_ddmmyyyy, celular, convenioCode }, token).nropac

const especialidades = listarEspecialidades(token)
const especialidadeCode = userSelect(especialidades, 'descricao').especialidade

gerarAtendimento({ patientId, convenioCode, especialidadeCode }, token)
```

## UX Observações

- As listas de convênios/especialidades podem ser extensas — oferecer busca textual e scroll/paginação eficiente.
- Mensagens de erro devem ser curtas e não técnicas, com sugestão de ajuda humana quando necessário.
- Monitorar expiração do token; ao detectar 401/403 refazer login automaticamente e repetir a chamada original.

## Referência de cURL

- Exemplos completos para cada endpoint foram capturados durante a análise e devem ser usados para debugar rapidamente chamadas isoladas (substituir credenciais sensíveis antes de compartilhar).

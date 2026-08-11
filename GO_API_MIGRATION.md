# Migração para GO-API

Este documento descreve a migração do sistema de WhatsApp de Whapi.cloud para GO-API.

## Mudanças Realizadas

### 1. Funções Supabase Atualizadas

Todas as funções do Supabase foram atualizadas para usar GO-API:

- **`send-whatsapp`**: Envio de mensagens individuais
- **`send-whatsapp-bulk`**: Envio de mensagens em massa
- **`whatsapp-connection`**: Gerenciamento de conexão, QR code, chats e mensagens
- **`daily-report`**: Relatórios diários via WhatsApp

### 2. Autenticação

**Antes (Whapi.cloud):**
- Header: `Authorization: Bearer {WHAPI_TOKEN}`
- Variável de ambiente: `WHAPI_TOKEN`

**Agora (GO-API):**
- Header: `x-api-key: {GO_API_KEY}` ou `apikey: {GO_API_KEY}`
- **NÃO usa Machine ID** nas requisições (apenas na URL base)
- Variável de ambiente: `GO_API_KEY` e `GO_API_BASE_URL`

### 3. Endpoints

Os endpoints foram adaptados para a estrutura da GO-API:

| Funcionalidade | Endpoint GO-API |
|----------------|-----------------|
| Enviar mensagem | `POST /api/send/text` |
| Listar contatos | `GET /api/contacts/all` |
| Listar grupos | `GET /api/contacts/groups` |
| Verificar conexão | `GET /api/contacts/all` (usa para verificar) |
| QR Code | ❌ Não disponível (feito via painel) |
| Logout | ❌ Não disponível (feito via painel) |
| Perfil | ❌ Não disponível |
| Mensagens de chat | ❌ Não disponível |

**Nota:** Os endpoints exatos podem variar conforme a documentação oficial da GO-API. Ajuste a variável `GO_API_BASE_URL` se necessário.

### 4. Formato de Números de Telefone

A GO-API aceita números com ou sem o dígito 9, facilitando o uso. O sistema continua formatando para o código do país de Moçambique (258) quando necessário.

### 5. Frontend

As referências no frontend foram atualizadas:
- Instância padrão: `whapi-channel` → `go-api-instance`
- Mensagens de configuração atualizadas para mencionar `GO_API_KEY`

## Configuração

### 1. Obter API Key da GO-API

1. Acesse o painel da GO-API
2. Crie uma instância
3. Copie a API Key gerada

### 2. Configurar no Supabase

Adicione as seguintes variáveis de ambiente nos secrets do Supabase:

```bash
# API Key da GO-API
GO_API_KEY=sua-api-key-aqui

# URL base da GO-API (OBRIGATÓRIO)
GO_API_BASE_URL=https://api-usego.pdjn0h.easypanel.host
```

**⚠️ IMPORTANTE:** 
- A GO-API **NÃO usa Machine ID** nas requisições, apenas a API Key
- A URL base é fornecida pela GO-API (exemplo: `https://api-usego.pdjn0h.easypanel.host`)
- Não inclua barra (/) no final da URL
- Use exatamente a URL fornecida pela GO-API

### 3. Verificar Endpoints

Verifique a documentação oficial da GO-API em:
https://documenter.getpostman.com/view/51268714/2sBXVeFCd2

Ajuste os endpoints nas funções do Supabase se necessário, especialmente:
- URL base da API
- Caminhos dos endpoints específicos
- Formato das requisições e respostas

## Estrutura de Resposta Esperada

A integração espera respostas no seguinte formato:

### Enviar Mensagem (POST /api/send/text)
**Request:**
```json
{
  "to": "258821081004",
  "text": "Mensagem de teste"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg123"
}
```

### Listar Contatos (GET /api/contacts/all)
**Response:**
```json
[
  {
    "id": "258821081004",
    "name": "Nome do Contato",
    "notify": "Nome"
  }
]
```

### Listar Grupos (GET /api/contacts/groups)
**Response:**
```json
[
  {
    "id": "120363xxx@g.us",
    "subject": "Nome do Grupo"
  }
]
```

### Status/Health
A GO-API não possui endpoint de status. A verificação de conexão é feita tentando listar contatos (`GET /api/contacts/all`). Se a requisição for bem-sucedida, a conexão está ativa.

### QR Code
A GO-API **não possui endpoint de QR code**. A conexão do WhatsApp é feita via painel da GO-API.

### Mensagens
A GO-API **não possui endpoint para buscar mensagens** de um chat específico.

## Notas Importantes

1. **Endpoints podem variar**: Os endpoints usados são baseados em suposições da estrutura típica de APIs de WhatsApp. Verifique a documentação oficial e ajuste conforme necessário.

2. **Compatibilidade**: O código mantém compatibilidade com a estrutura anterior, mas agora usa GO-API.

3. **Testes**: Teste todas as funcionalidades após a migração:
   - Envio de mensagens individuais
   - Envio em massa
   - Verificação de status
   - Geração de QR code
   - Listagem de chats
   - Leitura de mensagens

4. **Logs**: Monitore os logs das funções do Supabase para identificar problemas de integração.

## Suporte

Para mais informações sobre a GO-API:
- Portal: www.uego.com.br
- Email: contato@uego.com.br
- Documentação: https://documenter.getpostman.com/view/51268714/2sBXVeFCd2


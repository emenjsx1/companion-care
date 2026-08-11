# Troubleshooting - Evolution API "Invalid integration"

## O que significa "Invalid integration"?

Este erro geralmente indica que:
1. **A API Key está incorreta** - Verifique se copiou a chave completa
2. **A URL base está incorreta** - Verifique se é a URL correta da sua Evolution API
3. **A API Key não tem permissões** - Verifique se a chave tem permissão para criar instâncias

## Verificações Rápidas

### 1. Verificar Secrets no Supabase
1. Acesse: https://supabase.com/dashboard
2. Vá em: **Settings** → **Edge Functions** → **Secrets**
3. Verifique se existem:
   - `EVOLUTION_API_KEY` - Deve ser a chave completa da Evolution API
   - `EVOLUTION_API_URL` - Deve ser a URL base completa (ex: `https://sua-url.evolution-api.com`)

### 2. Verificar URL da Evolution API
A URL deve ser algo como:
- `https://sua-instancia.evolution-api.com`
- `https://api.evolution-api.com` (se for a versão cloud)
- `http://seu-ip:porta` (se for self-hosted)

**IMPORTANTE**: A URL não deve terminar com `/` (barra)

### 3. Verificar API Key
- A API Key deve ser a chave completa fornecida pela Evolution API
- Não deve ter espaços ou caracteres extras
- Deve ter permissões para criar instâncias

## Como Verificar os Logs

Após tentar criar uma instância:

1. No Dashboard do Supabase, vá em: **Edge Functions** → **evolution-instance** → **Logs**
2. Procure por mensagens que mostram:
   - `Evolution API URL: ...` - Verifique se está correto
   - `API Key present: true (length: XX)` - Verifique o tamanho
   - `Response status: 400` - Veja a mensagem de erro completa
   - `Response body: ...` - Veja o erro detalhado da Evolution API

## Soluções Comuns

### Solução 1: Verificar URL e API Key
Certifique-se de que:
- A `EVOLUTION_API_URL` está correta (sem barra no final)
- A `EVOLUTION_API_KEY` está completa e correta

### Solução 2: Testar a API diretamente
Use curl ou Postman para testar:

```bash
curl -X POST "https://SUA-URL/instance/create" \
  -H "Content-Type: application/json" \
  -H "apikey: SUA-API-KEY" \
  -d '{
    "instanceName": "teste",
    "qrcode": true
  }'
```

Se funcionar no curl mas não na função, o problema pode ser no formato da requisição.

### Solução 3: Verificar Documentação da Evolution API
Cada versão da Evolution API pode ter formatos diferentes. Verifique:
- A documentação da sua versão específica
- Se o endpoint é `/instance/create` ou outro
- Se o header de autenticação é `apikey` ou `Authorization`

## Próximos Passos

1. **Atualize a função** no Dashboard com o código mais recente (já tem logs melhorados)
2. **Tente criar uma instância** novamente
3. **Verifique os logs** no Dashboard do Supabase
4. **Envie os logs** para ajustarmos o código conforme necessário


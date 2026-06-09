# Carmen Mobile → Telegram Webhook

Este projeto recebe placas capturadas pelo Carmen Mobile/Carmen Cloud e envia para o Telegram.

A mensagem enviada ao Telegram contém **somente a placa**.

Exemplo de mensagem enviada:

```text
ABC1D23
```

## Arquivos do pacote

- `server.js` — aplicação principal.
- `package.json` — dependências e comando de inicialização.
- `.env.example` — exemplo das variáveis necessárias.

## 1. Criar o bot no Telegram

1. Abra o Telegram.
2. Procure por `@BotFather`.
3. Envie `/newbot`.
4. Escolha um nome para o bot.
5. Escolha um usuário terminado em `bot`, por exemplo: `minhasplacas_bot`.
6. Copie o token gerado. Ele será parecido com:

```text
123456789:ABCDEF_seu_token_aqui
```

Esse token será usado na variável:

```text
TELEGRAM_BOT_TOKEN
```

## 2. Descobrir o CHAT_ID

### Para enviar para você mesmo

1. Abra uma conversa com o bot criado.
2. Envie qualquer mensagem para ele, por exemplo: `teste`.
3. No navegador, acesse:

```text
https://api.telegram.org/botSEU_TOKEN_AQUI/getUpdates
```

4. Procure por algo assim:

```json
"chat":{"id":123456789
```

Esse número é o seu `TELEGRAM_CHAT_ID`.

### Para enviar para um grupo

1. Adicione o bot no grupo.
2. Envie uma mensagem no grupo mencionando o bot ou envie qualquer mensagem no grupo.
3. Acesse:

```text
https://api.telegram.org/botSEU_TOKEN_AQUI/getUpdates
```

4. Procure o campo `chat.id` do grupo.

Normalmente o ID de grupo começa com `-`, por exemplo:

```text
-1001234567890
```

## 3. Subir no GitHub

1. Crie uma conta no GitHub, se ainda não tiver.
2. Crie um novo repositório, por exemplo: `carmen-telegram-webhook`.
3. Envie estes arquivos para o repositório:
   - `server.js`
   - `package.json`
   - `.env.example`
   - `README.md`

## 4. Publicar na Northflank

1. Entre em https://northflank.com/
2. Crie uma conta ou faça login.
3. Crie um novo projeto.
4. Escolha criar um novo serviço/app a partir do GitHub.
5. Selecione o repositório `carmen-telegram-webhook`.
6. Configure como aplicação Node.js.
7. Comando de start:

```text
npm start
```

8. Adicione as variáveis de ambiente:

```text
TELEGRAM_BOT_TOKEN=seu_token_do_bot
TELEGRAM_CHAT_ID=seu_chat_id
```

9. Faça o deploy.
10. A Northflank deverá gerar uma URL pública parecida com:

```text
https://site--nome-do-projeto--codigo.code.run
```

## 5. Testar se está online

Abra a URL gerada pela Northflank no navegador.

Você deve ver algo parecido com:

```json
{"service":"Carmen Mobile Webhook","status":"online"}
```

## 6. URL do webhook

A URL que você deve configurar no Carmen Mobile/Carmen Cloud será:

```text
https://SUA-URL-DA-NORTHFLANK/webhook
```

Exemplo:

```text
https://site--carmenmobile-oficial--xxxx.code.run/webhook
```

## 7. Teste manual

Você pode testar enviando uma requisição POST para `/webhook` com este JSON:

```json
{
  "plate": "ABC1D23"
}
```

Se tudo estiver correto, o Telegram receberá somente:

```text
ABC1D23
```

## Observação importante

O Carmen pode enviar a placa com nomes de campos diferentes. Por isso, a aplicação tenta localizar a placa em vários formatos comuns, como:

- `plate`
- `license_plate`
- `licensePlate`
- `vehicle.plate`
- `recognition.plate`
- `data.plate`

Se o Carmen enviar em outro formato, será necessário ajustar o arquivo `server.js`.

# 📬 Notification Service

Sistema de envio de notificações assíncronas com NestJS, RabbitMQ, PostgreSQL e Prisma, totalmente containerizado com Docker e com suporte a métricas, DLQ, health checks e testes automatizados.

---

## 📋 Índice

- [Tecnologias](#-tecnologias)
- [Funcionalidades](#-funcionalidades)
- [Instruções para Execução](#-instruções-para-execução)
- [Endpoints REST](#-endpoints-rest)
- [Decisões Arquiteturais](#-decisões-arquiteturais)
- [Dificuldades e Soluções](#-dificuldades-e-soluções)
- [Monitoramento](#-monitoramento)
- [Estrutura do Projeto](#-estrutura-do-projeto)

---

## 🚀 Tecnologias

- **NestJS** – Framework backend
- **TypeScript** – Linguagem principal
- **Prisma ORM** – Acesso ao PostgreSQL
- **PostgreSQL** – Banco de dados relacional
- **RabbitMQ** – Sistema de mensageria (fila)
- **Docker + Docker Compose** – Containerização
- **Jest + Supertest** – Testes unitários e end-to-end

---

## 📦 Funcionalidades

- ✅ Envio de notificações via API REST
- ✅ Enfileiramento com RabbitMQ (`direct exchange`)
- ✅ Processamento assíncrono com worker e delay (2–5s)
- ✅ Retry automático com limite configurável
- ✅ Envio para **Dead Letter Queue (DLQ)** em caso de falha
- ✅ Monitoramento de mensagens processadas e falhas
- ✅ Endpoint `/health` para verificação de serviços
- ✅ Testes unitários e E2E com cobertura

---

## 🔧 Instruções para Execução

### Pré-requisitos

- Docker e Docker Compose instalados
- Node.js v16+ (apenas se for rodar fora do container)
- Git

### Execução com Docker (Recomendado)

1. Clone o repositório
```bash
git clone https://github.com/Andydev0/notification-service.git
cd notification-service
```

2. Suba todos os serviços
```bash
docker compose up --build
```

3. Acesse a API em `http://localhost:3000`

### Execução Local (Desenvolvimento)

1. Clone o repositório e instale as dependências
```bash
git clone https://github.com/Andydev0/notification-service.git
cd notification-service
npm install
```

2. Configure as variáveis de ambiente
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

3. Inicie o PostgreSQL e RabbitMQ via Docker
```bash
docker compose up -d postgres rabbitmq
```

4. Execute as migrações do Prisma
```bash
npx prisma db push
```

5. Inicie o servidor em modo de desenvolvimento
```bash
npm run start:dev
```

---

## 📡 Endpoints REST

| Método | Rota | Descrição |
|--------|------|----------|
| POST | `/notifications` | Envia nova notificação para a fila |
| GET | `/notifications` | Lista todas as notificações |
| GET | `/notifications/:id` | Detalhes de uma notificação |
| GET | `/notifications/status/:id` | Verifica o status de uma notificação |
| GET | `/health` | Verifica status de RabbitMQ e PostgreSQL |
| GET | `/metrics/status` | Exibe contadores de sucesso e falhas |

---

## 🛠 Decisões Arquiteturais

### Padrão de Mensageria

Escolhi o RabbitMQ com `direct exchange` pelos seguintes motivos:

- **Desacoplamento**: Separação clara entre o serviço que recebe as requisições (API) e o que processa as notificações (worker)
- **Resiliência**: Mensagens persistentes que sobrevivem a reinicializações do sistema
- **Escalabilidade**: Possibilidade de escalar horizontalmente os workers sem modificar a API
- **Controle de carga**: Evita sobrecarga do sistema em momentos de pico de envio

### Arquitetura Modular do NestJS

Utilizei a estrutura de módulos do NestJS para:

- **Separação de responsabilidades**: Cada módulo tem uma função específica (notifications, worker, queue, etc.)
- **Inversão de controle**: Injeção de dependências para facilitar testes e manutenção
- **Reutilização de código**: Serviços compartilhados entre diferentes partes da aplicação

### Persistência com Prisma

Escolhi o Prisma como ORM pelos seguintes benefícios:

- **Type safety**: Integração perfeita com TypeScript
- **Migrations automáticas**: Facilidade para evoluir o schema do banco
- **Queries otimizadas**: Melhor performance comparado a ORMs tradicionais
- **Cliente gerado**: Autocomplete e validação em tempo de desenvolvimento

---

## 🔧 Dificuldades e Soluções

### Conexão com RabbitMQ em ambiente Docker

**Problema**: Dificuldade na conexão entre os containers da aplicação e do RabbitMQ durante a inicialização.

**Solução**: 
- Implementei um mecanismo de retry na conexão
- Utilizei a opção `depends_on` no docker-compose.yml
- Adicionei um health check para garantir que o RabbitMQ esteja pronto antes de iniciar a aplicação

### Tratamento de Falhas no Processamento

**Problema**: Mensagens falhando silenciosamente sem registro adequado ou possibilidade de reprocessamento.

**Solução**:
- Implementei o padrão Dead Letter Queue (DLQ)
- Criei um sistema de retry com backoff exponencial
- Adicionei logs detalhados para facilitar o diagnóstico de problemas
- Desenvolvi endpoints de monitoramento para acompanhar falhas

### Testes End-to-End com Dependências Externas

**Problema**: Dificuldade em testar a integração com RabbitMQ e PostgreSQL nos testes automatizados.

**Solução**:
- Criei containers dedicados para testes no pipeline CI/CD
- Implementei mocks para testes unitários
- Utilizei o padrão de repository para abstrair o acesso ao banco de dados
- Desenvolvi helpers para limpar o ambiente entre testes

---

## 🔁 Retry + DLQ (Dead Letter Queue)

Cada mensagem que falhar no processamento é reenviada até 3 tentativas.

Após o limite, ela é enviada para a fila `notifications_dlq`.

Para simular falha, envie uma notificação com:

```json
{
  "userId": "fail",
  "message": "forcar_erro",
  "type": "email"
}
```

---

## 🧪 Testes

### Unitários
```bash
npm run test
```

### End-to-End (E2E)
Dentro do container (recomendado):

```bash
docker compose exec app npm run test:e2e
```

Certifique-se de que o banco e o RabbitMQ estão prontos antes de executar.

---

## 🧠 Monitoramento

`GET /metrics/status` retorna o total de mensagens:

- ✅ processadas com sucesso
- ❌ enviadas para a DLQ

`GET /health` retorna:

```json
{ "status": "ok" }
```

Ou em caso de falha:

```json
{ "status": "error", "message": "RabbitMQ não está conectado" }
```

---

## 🐇 RabbitMQ UI (opcional)

Acesse: http://localhost:15672

Login: guest | Senha: guest

---

## 🗂 Estrutura do Projeto

```
📦 notification-service
├── src/
│   ├── notifications/        # Controlador e serviço principal
│   ├── worker/               # Worker que processa notificações
│   ├── queue/                # Configuração RabbitMQ
│   ├── prisma/               # PrismaService
│   ├── health/               # Health check dos serviços
│   ├── metrics/              # Métricas básicas
├── prisma/
│   └── schema.prisma         # Definição do modelo Notification
├── test/
│   └── app.e2e-spec.ts       # Testes de integração (e2e)
├── Dockerfile
├── docker-compose.yml
├── .env
└── README.md
```

---

## ✅ Requisitos

- Docker e Docker Compose instalados
- Node.js (apenas se for rodar fora do container)

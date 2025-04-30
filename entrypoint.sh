#!/bin/sh

# Aguarda o PostgreSQL ficar disponível
echo "Aguardando o banco postgres:5432 ficar disponível..."
until nc -z postgres 5432; do
  sleep 2
done

echo "Banco de dados está pronto. Rodando Prisma e iniciando a aplicação..."

# Aplica o schema Prisma
npx prisma db push

# Inicia a aplicação
npm run start:prod

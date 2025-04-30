FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

RUN apt-get update && apt-get install -y netcat-openbsd

COPY prisma ./prisma
COPY . .

RUN npx prisma generate
RUN npm run build

COPY entrypoint.sh ./
EXPOSE 3000

CMD ["sh", "./entrypoint.sh"]

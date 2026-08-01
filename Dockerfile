FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 4000

# Exécutez les migrations avant le premier démarrage (voir docker-compose.yml ou README) :
#   docker compose exec api npm run migrate
CMD ["node", "src/server.js"]

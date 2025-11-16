FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache postgresql-client

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8000

CMD ["node", "src/server.js"]

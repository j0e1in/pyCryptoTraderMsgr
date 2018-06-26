FROM node:10-alpine

RUN adduser -S admin

WORKDIR /app

COPY package.json /app/
COPY package-lock.json /app/
RUN npm install && \
    rm -rf ~/.npm

COPY . /app

USER admin

ENTRYPOINT ["node", "server.js"]

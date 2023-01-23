FROM node

ARG server_port=8082
ENV SERVER_PORT=$server_port

WORKDIR $HOME/app

COPY . .
RUN npm ci

ENV NODE_ENV=production
RUN npm run tsc

EXPOSE $server_port

CMD ["node", "build/index.js"]
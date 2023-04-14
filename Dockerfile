FROM node:lts

WORKDIR /usr/src/app

ARG NODE_ENV=production

ADD ./src/* .

RUN npm install --quiet

CMD ["node-ts", "app.ts"]

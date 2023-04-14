FROM node:lts

WORKDIR /usr/src/app

ARG NODE_ENV=production

COPY src/ .
COPY package.json .

RUN npm install --quiet

CMD ["npm", "run", "dev"]

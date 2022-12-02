FROM node:18-alpine

ENV NODE_ENV=production

WORKDIR /app

RUN mkdir -p ./download

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY index.mjs ./

EXPOSE 3000

CMD ["yarn", "start"]

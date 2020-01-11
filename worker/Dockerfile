FROM node:10-alpine

RUN apk add --no-cache \
    g++ \
    git \
    make \
    openssh-client \
    python

WORKDIR /app
COPY . /app

RUN npm install

CMD ["node", "/app/index.js"]

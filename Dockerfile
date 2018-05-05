FROM node:alpine
LABEL maintainer="https://github.com/foobert/gc-siphon"
WORKDIR /usr/src/app
COPY package.json package-lock.json /usr/src/app/
RUN npm install --production
COPY index.js /usr/src/app/
COPY lib /usr/src/app/lib/
CMD npm start

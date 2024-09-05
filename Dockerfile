FROM node:21-alpine

# Set the timezone
RUN apk update && apk add --no-cache tzdata
ENV TZ=Europe/Kiev

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD [ "npm", "start" ]
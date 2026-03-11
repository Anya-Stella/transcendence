FROM node:20-alpine

WORKDIR /app

<<<<<<< HEAD
COPY package.json package-lock.json ./
RUN npm ci
=======
COPY package.json ./
RUN npm install
>>>>>>> origin/dev

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]

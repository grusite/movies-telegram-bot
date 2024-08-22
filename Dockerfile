FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --only=production
COPY . .
RUN npm run build
COPY .env ./
ENV NODE_ENV=production
ENV PORT=3000
CMD ["node", "dist/index.js"]
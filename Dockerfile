# Create an image only for the build
FROM node:20-alpine AS build
WORKDIR /usr/src/app
COPY package*.json ./
# Install the dependencies (including devDependencies)
RUN npm install
COPY . .
# Build the TypeScript code
RUN npm run build

# Use a smaller Node.js base image for production
FROM node:20-alpine AS production
WORKDIR /usr/src/app
# Just copy the production node_modules and dist folder from the build stage
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY .env ./
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/index.js"]
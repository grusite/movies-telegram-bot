# Create an image only for the build
FROM node:20-alpine AS builder
WORKDIR /usr/src
COPY package*.json ./
# Install the dependencies (including devDependencies)
RUN npm install
COPY . .
# Build the TypeScript code
RUN npm run build

# # Use a smaller Node.js base image for production
FROM node:20-alpine AS production
WORKDIR /usr/src
# Just copy the production node_modules and dist folder from the build stage
COPY --from=builder /usr/src/node_modules ./node_modules
COPY --from=builder /usr/src/dist ./dist
COPY package*.json ./
EXPOSE 3000
CMD ["npm", "run", "start-ci"]
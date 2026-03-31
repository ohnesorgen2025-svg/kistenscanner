FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm ci

FROM deps AS build
COPY client client
COPY server server
RUN npm run build

FROM node:20-alpine AS prod-deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm ci --omit=dev --workspace server

FROM node:20-alpine AS final
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/package.json ./package.json
COPY --from=prod-deps /app/package-lock.json ./package-lock.json
COPY --from=prod-deps /app/server/package.json ./server/package.json
COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/server/dist ./server/dist
EXPOSE 4001 4443
CMD ["node", "server/dist/index.js"]

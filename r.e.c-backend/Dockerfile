FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --include=dev

FROM deps AS build
COPY prisma ./prisma
COPY scripts ./scripts
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run prisma:generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4001

COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/scripts ./scripts

# Install only production dependencies in final stage
RUN npm ci --omit=dev && npm cache clean --force

RUN mkdir -p /app/uploads && chown -R node:node /app/uploads
USER node

EXPOSE 4001

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 4001) + '/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]

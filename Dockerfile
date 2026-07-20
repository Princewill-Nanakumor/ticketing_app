FROM node:22-alpine AS base

WORKDIR /app

FROM base AS deps

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci

FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules

COPY . .

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

RUN npm run build
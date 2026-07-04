FROM node:20-alpine AS base

WORKDIR /app

# RUN if [ -f "/app/package-lock.json" ]; then rm "/app/package-lock.json"; fi
# RUN npm install

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]

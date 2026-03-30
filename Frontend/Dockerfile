FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production=false

# Copy all files
COPY . .

# Build Next.js app
RUN npm run build

# Move to standalone output
WORKDIR /app/.next/standalone

# Copy static + public files
COPY --from=0 /app/.next/static ./.next/static
COPY --from=0 /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
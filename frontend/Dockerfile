FROM node:20-alpine AS base-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

FROM base-stage AS dev-stage
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

FROM base-stage AS build-stage
RUN npm run build

FROM nginx:stable-alpine AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Note: for dev we use npm run dev

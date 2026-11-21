# Etapa 1: Compilación de la aplicación con Node.js
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Argumentos de compilación para Vite (inyectar en build sin secretos hardcodeados — AUD-026)
ARG VITE_API_URL=http://localhost:5000/api
ARG VITE_GOOGLE_CLIENT_ID=""
ARG VITE_CLOUDINARY_CLOUD_NAME=""
ARG VITE_CLOUDINARY_UPLOAD_PRESET=""
ARG VITE_WOMPI_PUBLIC_KEY=""

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_CLOUDINARY_CLOUD_NAME=$VITE_CLOUDINARY_CLOUD_NAME
ENV VITE_CLOUDINARY_UPLOAD_PRESET=$VITE_CLOUDINARY_UPLOAD_PRESET
ENV VITE_WOMPI_PUBLIC_KEY=$VITE_WOMPI_PUBLIC_KEY

RUN npm run build

# Etapa 2: Servidor web de producción con Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/index.html >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]

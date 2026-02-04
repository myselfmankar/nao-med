# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/ui
COPY ui/package*.json ./
RUN npm install
COPY ui/ ./
RUN npm run build

# Stage 2: Run Backend
FROM python:3.11-slim
WORKDIR /app

# Install System Dependencies (for simple audio handling if needed)
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Install Python Dependencies using uv
COPY requirements.txt .
RUN pip install uv && uv pip install --system --no-cache -r requirements.txt

# Copy Backend Code
COPY app ./app
COPY .env .

# Copy Built Frontend from Stage 1
COPY --from=frontend-build /app/ui/dist ./ui/dist

# Make Uploads Dir
RUN mkdir uploads

# Run
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

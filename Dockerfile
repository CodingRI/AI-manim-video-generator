FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    ffmpeg \
    libcairo2-dev \
    libpango1.0-dev \
    pkg-config \
    python3-dev \
    build-essential \
    gcc \
    git \
    curl \
    fonts-dejavu-core \
    fonts-liberation \
    fontconfig \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-science \
    dvisvgm \
    libgl1-mesa-dev \
    libosmesa6-dev \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

RUN pnpm install

COPY . .

RUN npx prisma generate

RUN pip install --no-cache-dir manim==0.20.0

RUN mkdir -p generated public/videos

CMD xvfb-run -s "-screen 0 1400x900x24" pnpm worker
FROM golang:1.22 AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
  build-essential \
  ninja-build \
  meson \
  wget \
  pkg-config

RUN apt-get install -y \
  glib-2.0-dev \
  libexpat-dev \
  librsvg2-dev \
  libpng-dev \
  libwebp-dev \
  libjpeg-dev \
  libexif-dev \
  liblcms2-dev \
  libglib2.0-dev \
  libpango1.0-dev \
  libgirepository1.0-dev \
  liborc-dev

ARG VIPS_VERSION=8.13.0
ARG VIPS_URL=https://github.com/libvips/libvips/releases/download

WORKDIR /usr/local/src

RUN wget ${VIPS_URL}/v${VIPS_VERSION}/vips-${VIPS_VERSION}.tar.gz \
  && tar xf vips-${VIPS_VERSION}.tar.gz \
  && cd vips-${VIPS_VERSION} \
  && meson build --buildtype=release --libdir=lib \
  && cd build \
  && ninja \
  && ninja install

ENV LD_LIBRARY_PATH /usr/local/lib
ENV PKG_CONFIG_PATH /usr/local/lib/pkgconfig

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o /app/transformer .

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
  libglib2.0-0 \
  libgobject-2.0-0 \
  libgirepository-1.0-1 \
  libexpat1 \
  librsvg2-2 \
  libcairo2 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libpng16-16 \
  libwebp7 \
  libwebpdemux2 \
  libwebpmux3 \
  libjpeg62-turbo \
  libexif12 \
  liblcms2-2 \
  liborc-0.4-0 \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy only shared libraries from the vips build, not static libs or pkgconfig
COPY --from=builder /usr/local/lib/*.so* /usr/local/lib/
RUN ldconfig

WORKDIR /app

COPY --from=builder /app/transformer .
COPY --from=builder /app/views ./views
COPY --from=builder /app/static ./static

# Create non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
RUN mkdir -p /app/files/queue /app/files/done && chown -R appuser:appgroup /app

USER appuser

EXPOSE 7004

CMD ["./transformer"]

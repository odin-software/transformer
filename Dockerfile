
FROM golang:1.22

WORKDIR /app


# start

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

COPY . ./

# end

RUN go mod download

RUN go build -o ./tmp/main .

EXPOSE 9090

CMD ["./tmp/main"]

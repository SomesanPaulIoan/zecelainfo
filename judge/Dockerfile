FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    build-essential \
    libcap-dev \
    libseccomp-dev \
    libsystemd-dev \
    pkg-config \
    git \
    wget \
    curl \
    ca-certificates \
    python3 \
    python3-pip \
    fpc \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/ioi/isolate.git /opt/isolate
WORKDIR /opt/isolate
RUN make install

# Isolate 2.x sandboxes each box in its own user namespace, mapped from a
# subordinate uid/gid range owned by a dedicated, unprivileged "isolate" user.
RUN useradd -r -s /usr/sbin/nologin isolate \
    && usermod --add-subuids 200000-300000 --add-subgids 200000-300000 isolate

# cg_root is set up at container start (entrypoint.sh) once the container's
# own cgroup subtree is delegated; point isolate at that fixed path here.
RUN sed -i 's#cg_root = auto:/run/isolate/cgroup#cg_root = /sys/fs/cgroup/isolate#' /usr/local/etc/isolate

WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "worker.js"]

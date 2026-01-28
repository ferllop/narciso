#!/usr/bin/env bash

set -e

source .env

IMAGE_NAME="${NARCISO_IMAGE_NAME:-narciso-puppeteer}"
CONTAINER_NAME="${NARCISO_CONTAINER_NAME:-narciso}"
USER_UID=$(id -u)
USER_GID=$(id -g)

if [ -z "$(docker images -q $IMAGE_NAME 2> /dev/null)" ]; then
  docker build -t "$IMAGE_NAME" --file ./docker/Dockerfile --build-arg USER_UID="${USER_UID}" --build-arg USER_GID="${USER_GID}" . 
fi

if [ -z "$(docker ps -q -f name=$CONTAINER_NAME 2> /dev/null)" ]; then
  docker run \
    --init \
    --cap-add SYS_ADMIN \
    --workdir /app \
    -e "TZ=${TIMEZONE}" \
    -v ./:/app \
    -u "${USER_UID}:${USER_GID}" \
    --name "$CONTAINER_NAME" \
    --restart no \
    --rm \
    -t \
    "$IMAGE_NAME" "$@"
else
  docker exec -it "$CONTAINER_NAME" "$@"
fi

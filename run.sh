#!/usr/bin/env bash

set -e

IMAGE_NAME="${NARCISO_IMAGE_NAME:-narciso-puppeteer}"
CONTAINER_NAME="${NARCISO_CONTAINER_NAME:-narciso}"

if [ -z "$(docker images -q $IMAGE_NAME 2> /dev/null)" ]; then
  docker build -t $IMAGE_NAME ./docker/
fi

if [ -z "$(docker ps -q -f name=$CONTAINER_NAME 2> /dev/null)" ]; then
  docker run \
    --init \
    --cap-add SYS_ADMIN \
    --workdir /app \
    -v /etc/timezone:/etc/timezone:ro \
    -v /etc/localtime:/etc/localtime:ro \
    -e "TZ=$(cat /etc/timezone)" \
    -v ./:/app \
    -u $(id -u) \
    --name $CONTAINER_NAME \
    --restart no \
    --rm \
    -t \
    $IMAGE_NAME "$@"
else
  docker exec -it $CONTAINER_NAME "$@"
fi

#!/usr/bin/env bash

IMAGE_NAME="narciso-puppeteer"
CONTAINER_NAME=narciso

set -e

if [ -z "$(docker images -q $IMAGE_NAME 2> /dev/null)" ]; then
  docker build -t $IMAGE_NAME ./docker/
fi


if [ -z "$(docker ps -q -f name=$CONTAINER_NAME 2> /dev/null)" ]; then
  docker run \
    --init \
    --cap-add SYS_ADMIN \
    --workdir /app \
    -v ./:/app \
    -u $(id -u) \
    --name $CONTAINER_NAME \
    --restart no \
    --rm \
    -ti \
    $IMAGE_NAME "$@"
else
  docker exec -it $CONTAINER_NAME "$@"
fi

#!/usr/bin/env bash

set -e
IMAGE_NAME="scrapping-reviews-puppeteer"
if [ -z "$(docker images -q $IMAGE_NAME 2> /dev/null)" ]; then
  docker build -t $IMAGE_NAME ./docker/
fi

docker run \
	--init \
	--cap-add SYS_ADMIN \
	--workdir /app \
	-v ./:/app \
	-u $(id -u) \
	--name scraping_reviews \
	--restart no \
	--rm \
	-ti \
	$IMAGE_NAME "$@"

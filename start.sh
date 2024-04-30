 #!/usr/bin/env bash

 set -e
 docker run \
	 --init \
	 --cap-add SYS_ADMIN \
	 --workdir /app \
	 -v ./:/app \
	 -u 1000 \
	 --name scraping_reviews \
	 --restart no \
	 --rm \
	 ghcr.io/puppeteer/puppeteer:latest npm start $1

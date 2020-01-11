# Bitvavo test task

## simple system kick-start
```shell script
git clone git@github.com:maozedong/bitvavo-test.git
cd bitvavo-test
docker-compose up --build
```
After that open this link `http://localhost:9034/index.html?market=BTC-EUR&start=1578737048848`

## Overview
System is composed from 3 independent services: worker, ws-api and client

### worker
This service is responsible for getting and persisting trades data from bitvavo api.
It takes market name from environment variable MARKET. That means if other market need to be added to system
another instance of service should be launched with appropriate environment variables set.

### ws-api 
This service is responsible for transmitting market data to end-users via websockets protocol.
It will send last 10 minutes of data in response to user subscription and than send 
new trades as they appears in database

### client
Simple static express server with example page that shows market trades chart
use this url format to set market and starttime `http://localhost:<port>/index.html?market=<market-name>&start<start-timestamp>`

### api
This service was used for REST api. Currently it is replaced with ws-api

##process-manager solutions overview (high availability for services)
When launching system with docker-compose failures are caught by docker (see `restart: on-failure` directive)
On production i'd recommend to use (pm2)[https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/] since it is mostly used for managing nodejs proceses.
Or (systemd)[https://www.freedesktop.org/wiki/Software/systemd/] - it's a default service manager for most linux distributions and familiar for most system admins


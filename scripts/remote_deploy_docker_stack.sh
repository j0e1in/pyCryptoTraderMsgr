#!/bin/bash

# Usage:
#   ./scripts/system/remote_deploy_docker_stack.sh [user]@[host] [data | db | dev | test | test-trading | production | optimize]
#

PROJ_DIR=pyCryptoTraderMsgr
DOCKER_DIR=docker
CUR_DIR=$(pwd)

# Check if current path ends with project name
if [[ "$CUR_DIR" != */$PROJ_DIR ]]; then
  echo "ERROR: Please run this script at project root."
  exit 1
fi

REMOTE=$1
TYPE=$2

# Split remote by '@', into an array (-a)
IFS='@' read -r -a REMOTE <<< $REMOTE

USERNAME=${REMOTE[0]}
HOST=${REMOTE[1]}

if [ -z $USERNAME ] | [ -z $HOST ] | [ -z $TYPE ]; then
  echo "Usage: remote_deploy_docker_stack.sh [username]@[host] [--no-cache] [options]"
  exit 1
fi

# Add custom arguments to commands ran in this script
build_args=""
pull=""

# Examine arguments after the second
while :; do
    case $3 in
      --pull) pull="true";; # pull image instead of building it locally
      --follow | -f) follow_log="-f";; # Enable follow in TAIL_LOG
      *) break
    esac
    shift
done

# If --pull argument is specified,
# pull from docker registry instead of build from source
if [ "$pull" == "true" ]; then
  IMG_ACTION=pulling
  GET_IMAGE="docker pull gcr.io/docker-reghub/pyct"
else
  IMG_ACTION=building
  GET_IMAGE="docker-compose build $build_args"
fi

if [ "$reset_state" == "true" ]; then
  RESET_STATE="export RESET_STATE=--reset"
else
  RESET_STATE=":"
fi


echo -e "\n>>>  Deploy $TYPE docker stack to $USERNAME@$HOST by $IMG_ACTION image  <<<\n"
# read -p "Press [Enter] to continue..."


DEPLOY_CMD=":"
TAIL_LOG=":"
STACK_FILE=docker-stack-$TYPE.yml

if [ "$TYPE" == 'msgr' ]; then
  if [ -z $STACK_NAME ]; then
    STACK_NAME=msgr
  fi
  SERVICE_NAME=$STACK_NAME"_bot"
  TAIL_LOG="docker service logs $follow_log $SERVICE_NAME"
fi

REGHUB_KEYFILE=private/docker-reghub-0065a93a0ed4.json

cd ../
rm -rf $PROJ_DIR.zip
zip -9 -qr --exclude=*.git* --exclude=*node_modules* $PROJ_DIR.zip $PROJ_DIR
echo 'Uploading source...'
scp $PROJ_DIR.zip $USERNAME@$HOST:~/

ssh $USERNAME@$HOST \
  "PROJ_DIR=$PROJ_DIR && \
  rm -rf $PROJ_DIR && \
  unzip -q $PROJ_DIR.zip && \
  cd $PROJ_DIR && \
  \
  # Authorize access permission to gcr container registry
  gcloud auth activate-service-account --key-file $REGHUB_KEYFILE
  echo -e 'y\n' | gcloud auth configure-docker
  \
  $DEPLOY_CMD && \
  $GET_IMAGE && \
  \
  mkdir -p ../log && \
  \
  docker stack rm $STACK_NAME && \
  echo \"wait for 20 seconds...\" && \
  sleep 20 && \
  \
  docker stack deploy -c $DOCKER_DIR/$STACK_FILE $STACK_NAME && \
  echo \"wait for 20 seconds...\" && \
  sleep 20 && \
  \
  $TAIL_LOG"

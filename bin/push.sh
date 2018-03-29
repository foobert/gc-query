#!/bin/bash

function main {
  local image=$1
  local branch=${TRAVIS_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}
  local tag=$(git show -s --format=%ct-%h HEAD)

  if [ "${DOCKER_USERNAME}" != "" -a "${DOCKER_PASSWORD}" != "" ]
  then
    docker login -u "${DOCKER_USERNAME}" -p "${DOCKER_PASSWORD}"
  fi

  if [ "${branch}" = "master" ]
  then
    docker push "${image}:latest"
  else
    tag="${tag}-${branch}"
  fi

  docker tag "${image}:latest" "${image}:${tag}"
  docker push "${image}:${tag}"
}

set -e
main "$@"

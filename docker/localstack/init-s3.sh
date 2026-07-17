#!/usr/bin/env sh
set -eu

awslocal s3 mb s3://lazonube-private || true
awslocal s3 mb s3://lazonube-public || true

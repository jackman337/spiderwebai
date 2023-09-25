#!/bin/bash

## deploy base lambda 3mb
cargo lambda build --release --arm64 --bin spider_service
cargo lambda deploy --iam-role $IAM_ROLE spider_service

# deploy chrome instance lambda
cargo lambda build --release --arm64 --features chrome --bin spider_service_chrome
cargo lambda deploy --iam-role $IAM_ROLE spider_service_chrome

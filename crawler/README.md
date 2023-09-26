# crawler

The service for the crawler.

## Getting Started

Make sure to have [Rust](https://doc.rust-lang.org/book/ch01-01-installation.html) installed or Docker.

The user agent is spoofed on each crawl to a random agent and the indexer extends [spider](https://github.com/madeindjs/spider) as the base.

1. `cargo run`

## ENV keys

SUPABASE_API_URL=http://localhost:54321/rest/v1/
SUPABASE_URL_STORAGE=http://localhost:54321/storage/v1
SUPABASE_API_KEY=
OPENAI_API_KEY=
STRIPE_API_SECRET=
STRIPE_API_PUBLISH=
STRIPE_WEBHOOK_SIGNING_SECRET=
OPENAI_API_KEY=
WHITE_LIST_URLS=http://localhost:3000
PROXY_URLS=
APP_API_URL=http://localhost:3000/crawler-webhook

### ENV Notes

The `PROXY_URLS` key takes a comma seperated list of urls. The urls can be http or socks5.

### Lambdas

Create a `.env.aws` file with the configs above to deploy to AWS. We pass in the env var `LAMBDA=aws` to load the file.

## Deploying

To build the lamda for deployment run the following:

`LAMBDA=aws cargo lambda build --release --arm64`. Remove the arm64 flag if you are not on arm.

`cargo lambda deploy \
  --iam-role arn:aws:iam::XXXXXXXXXXXXX:role/your_lambda_execution_role \
  spider_service`

Example:

`cargo lambda deploy \
  --iam-role arn:aws:iam::608440221714:role/powerlambda \
  spider_service`
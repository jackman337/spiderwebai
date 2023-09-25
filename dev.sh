#!/bin/bash

# start supabase - remove logflare container mac m1 docker issues
supabase start -x logflare &
# start crawler
(cd crawler && cargo lambda watch -a 127.0.0.1 -p 9001) &
(cd crawler && cargo lambda watch -a 127.0.0.1 -p 9002 --features chrome) &
# start front end and make sure modules installed
(cd frontend && npm i && npm run dev) &
(supabase status) &
# start stripe webhooks
stripe listen --forward-to localhost:3000/api/stripe-webhook
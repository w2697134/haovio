# Deploy From GitHub

This repository is the clean source for the Haovio Sale site. Runtime secrets and data stay on the server.

Do not commit:

- `.env` or `.env.*`
- `prisma/*.db`
- `.next/`
- `node_modules/`
- local temp scripts and diagnostics

Production server:

- root: `/www/wwwroot/sale`
- service: `sale`
- env: `/www/wwwroot/sale/.env`
- database: `/www/wwwroot/sale/prisma/prod.db`

Deployment shape:

1. Pull or clone `https://github.com/w2697134/haovio.git` on the server.
2. Preserve the production `.env` and `prisma/prod.db`.
3. Run `npm ci`.
4. Run `npx prisma generate`.
5. Run `npx prisma migrate deploy`.
6. Run `npm run build`.
7. Restart `sale` only after the build succeeds.

For the first GitHub-based deployment, build in a temporary directory first, then swap it into `/www/wwwroot/sale` after build success. This avoids replacing the live app with a failed build.

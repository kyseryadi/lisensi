require('dotenv/config');
const { defineConfig, env } = require('prisma/config');

module.exports = defineConfig({
  schema: 'prisma/supabase/schema.prisma',
  migrations: {
    path: 'prisma/supabase/migrations',
    seed: 'node prisma/seed.js'
  },
  datasource: { url: env('DIRECT_URL') }
});

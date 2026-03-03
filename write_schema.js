const fs = require('fs');
const content = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
}
`;
fs.writeFileSync('prisma/schema.prisma', content, 'utf8');
console.log('Schema written successfully');

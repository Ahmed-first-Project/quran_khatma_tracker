import { drizzle } from 'drizzle-orm/mysql2';
import { persons } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);
const result = await db.select().from(persons);
console.log('Persons count:', result.length);
if (result.length > 0) {
  console.log('First person:', result[0]);
}

import { head } from '@vercel/blob';

async function testHead() {
  try {
    const token = process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
    if (!token) {
      throw new Error('Missing VERCEL_BLOB_READ_WRITE_TOKEN');
    }
    const blob = await head('test.csv', { token });
    console.log('Head successful:', blob);
  } catch (err) {
    console.error('Head Error:', err);
  }
}

testHead();
import { head } from '@vercel/blob';

async function testHead() {
  try {
    const token = process.env.VERCEL_BLOB_READ_WRITE_TOKEN || 'vercel_blob_rw_PhfgF9BIDrk6kC5Y_Ci53HwHKbAHS5S1u5cVCP7Khg9s7Ot';
    if (!token) {
      throw new Error('Missing VERCEL_BLOB_READ_WRITE_TOKEN');
    }
    const blob = await head('test-WDyrUFq0BDGYK5jJDtERqdkSZfAotU.csv', { token });
    console.log('Head successful:', blob);
  } catch (err) {
    console.error('Head Error:', err);
  }
}

testHead();
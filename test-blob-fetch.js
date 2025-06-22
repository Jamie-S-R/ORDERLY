import { list } from '@vercel/blob';
import fetch from 'node-fetch';

async function testFetch() {
  try {
    const token = process.env.VERCEL_BLOB_READ_WRITE_TOKEN || 'vercel_blob_rw_PhfgF9BIDrk6kC5Y_Ci53HwHKbAHS5S1u5cVCP7Khg9s7Ot';
    const blobs = await list({ token });
    const testBlob = blobs.blobs.find(blob => blob.pathname === 'test.csv');
    if (!testBlob) {
      throw new Error('Test blob not found');
    }
    const response = await fetch(testBlob.downloadUrl);
    const text = await response.text();
    console.log('Fetch successful:', text);
  } catch (err) {
    console.error('Fetch Error:', err);
  }
}

testFetch();
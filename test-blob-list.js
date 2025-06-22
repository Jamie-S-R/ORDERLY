import { list } from '@vercel/blob';

async function testList() {
  try {
    const token = process.env.VERCEL_BLOB_READ_WRITE_TOKEN || 'vercel_blob_rw_PhfgF9BIDrk6kC5Y_Ci53HwHKbAHS5S1u5cVCP7Khg9s7Ot';
    const blobs = await list({ token });
    console.log('List successful:', blobs);
  } catch (err) {
    console.error('List Error:', err);
  }
}

testList();
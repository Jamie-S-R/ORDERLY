import { put } from '@vercel/blob';

async function testPut() {
  try {
    const token = process.env.VERCEL_BLOB_READ_WRITE_TOKEN || 'vercel_blob_rw_PhfgF9BIDrk6kC5Y_Ci53HwHKbAHS5S1u5cVCP7Khg9s7Ot';
    const testData = 'Test,Data\n1,Hello';
    await put('test.csv', testData, { access: 'public', token });
    console.log('Put successful');
  } catch (err) {
    console.error('Put Error:', err);
  }
}

testPut();
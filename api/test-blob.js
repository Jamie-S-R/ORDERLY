import { put, list } from '@vercel/blob';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    console.log('Test Blob Request:', { method: req.method });
    const token = process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
    if (!token) {
      throw new Error('Missing VERCEL_BLOB_READ_WRITE_TOKEN');
    }

    // Test PUT
    const testData = 'Test,Data\n1,Hello';
    await put('test.csv', testData, { access: 'public', token });

    // Test LIST and FETCH
    const blobs = await list({ token });
    const testBlob = blobs.blobs.find(blob => blob.pathname === 'test.csv');
    if (!testBlob) {
      throw new Error('Test blob not found');
    }
    const response = await fetch(testBlob.downloadUrl);
    const text = await response.text();

    res.status(200).json({ success: true, text });
  } catch (err) {
    console.error('Test Blob Error:', err);
    res.status(500).json({ error: err.message });
  }
}
import { Router } from 'express';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import fs from 'fs';
import path from 'path';
import os from 'os';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { url, service, method, proto, message } = req.body;
    if (!url || !service || !method || !proto) {
      return res.status(400).json({ detail: 'Missing url, service, method or proto' });
    }

    // Write proto to temp file
    const tmpFile = path.join(os.tmpdir(), `apiquick-${Date.now()}.proto`);
    fs.writeFileSync(tmpFile, proto);

    try {
      const packageDefinition = protoLoader.loadSync(tmpFile, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });

      const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
      const servicePath = service.split('.');
      let pkg: any = protoDescriptor;
      for (const part of servicePath) {
        pkg = pkg[part];
        if (!pkg) throw new Error(`Service ${service} not found in proto`);
      }

      const client = new pkg(url, grpc.credentials.createInsecure());
      const methodFn = client[method];
      if (!methodFn) throw new Error(`Method ${method} not found`);

      const result = await new Promise((resolve, reject) => {
        methodFn.call(client, message || {}, (err: any, response: any) => {
          if (err) reject(err);
          else resolve(response);
        });
      });

      res.json({ result });
    } finally {
      try { fs.unlinkSync(tmpFile); } catch { }
    }
  } catch (err: any) {
    res.status(502).json({ detail: err.message || 'gRPC failed' });
  }
});

export default router;

import type { VercelRequest, VercelResponse } from '@vercel/node';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MAX_FILE_SIZE = Number(process.env.MAX_UPLOAD_SIZE || 50 * 1024 * 1024);

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/jpg',
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
];

const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

function getCosConfig() {
  return {
    SecretId: process.env.COS_SECRET_ID,
    SecretKey: process.env.COS_SECRET_KEY,
    Bucket: process.env.COS_BUCKET,
    Region: process.env.COS_REGION,
  };
}

function isCosConfigured(): boolean {
  const cfg = getCosConfig();
  return Boolean(
    cfg.SecretId && cfg.SecretKey && cfg.Bucket && cfg.Region,
  );
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), UPLOAD_DIR);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型: ${file.mimetype}`));
    }
  },
});

async function uploadToCos(
  filePath: string,
  fileName: string,
  contentType: string,
): Promise<string> {
  const cosSdk = await import('cos-nodejs-sdk-v5');
  const cos = new cosSdk.default({
    SecretId: getCosConfig().SecretId as string,
    SecretKey: getCosConfig().SecretKey as string,
  });

  const bucket = getCosConfig().Bucket as string;
  const region = getCosConfig().Region as string;
  const key = `uploads/${Date.now()}-${fileName}`;

  return new Promise((resolve, reject) => {
    cos.putObject(
      {
        Bucket: bucket,
        Region: region,
        Key: key,
        Body: fs.createReadStream(filePath),
        ContentType: contentType,
      },
      (err: unknown, data: { Location?: string }) => {
        if (err) {
          reject(err);
        } else {
          const url = data.Location
            ? `https://${data.Location}`
            : `https://${bucket}.cos.${region}.myqcloud.com/${key}`;
          resolve(url);
        }
      },
    );
  });
}

const uploadMiddleware = upload.array('files', 20);

function runMiddleware(
  req: VercelRequest & { files?: Express.Multer.File[] },
  res: VercelResponse,
  fn: typeof uploadMiddleware,
): Promise<void> {
  return new Promise((resolve, reject) => {
    (fn as any)(req, res, (result: unknown) => {
      if (result instanceof Error) {
        reject(result);
        return;
      }
      resolve(result as void);
    });
  });
}

export default async function handler(
  req: VercelRequest & { files?: Express.Multer.File[] },
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    await runMiddleware(req, res, uploadMiddleware);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
    return;
  }

  const files = req.files || [];
  if (files.length === 0) {
    res.status(400).json({ error: '未上传文件' });
    return;
  }

  const useCos = isCosConfigured();
  const urls: string[] = [];

  for (const file of files) {
    if (useCos) {
      try {
        const cosUrl = await uploadToCos(
          file.path,
          file.filename,
          file.mimetype,
        );
        urls.push(cosUrl);
        try {
          fs.unlinkSync(file.path);
        } catch {
          // ignore cleanup errors
        }
      } catch (cosErr) {
        console.error('[Upload] COS upload failed, fallback to local:', cosErr);
        const localUrl = `/uploads/${file.filename}`;
        urls.push(localUrl);
      }
    } else {
      const localUrl = `/uploads/${file.filename}`;
      urls.push(localUrl);
    }
  }

  res.status(200).json({
    success: true,
    urls,
    storage: useCos ? 'cos' : 'local',
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

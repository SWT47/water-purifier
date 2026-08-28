import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import path from 'node:path';
import productsHandler from './api/products';
import productsCompareHandler from './api/products/compare';
import productsByIdHandler from './api/products/[id]';
import comboSchemesHandler from './api/combo-schemes';
import comboSchemesByIdHandler from './api/combo-schemes/[id]';

const app = express();
app.use(express.json());

app.all('/api/products', (req: Request, res: Response) =>
  productsHandler(req as any, res as any),
);
app.all('/api/products/compare', (req: Request, res: Response) =>
  productsCompareHandler(req as any, res as any),
);
app.all('/api/products/:id', (req: Request, res: Response) =>
  productsByIdHandler(req as any, res as any),
);
app.all('/api/combo-schemes', (req: Request, res: Response) =>
  comboSchemesHandler(req as any, res as any),
);
app.all('/api/combo-schemes/:id', (req: Request, res: Response) =>
  comboSchemesByIdHandler(req as any, res as any),
);

function readOnly(
  req: Request,
  res: Response,
  next: NextFunction,
  handler: (req: any, res: any) => Promise<void>,
): void {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  void handler(req as any, res as any);
  next();
}

app.get('/openapi/products', (req: Request, res: Response, next: NextFunction) =>
  readOnly(req, res, next, productsHandler),
);
app.get(
  '/openapi/products/compare',
  (req: Request, res: Response, next: NextFunction) =>
    readOnly(req, res, next, productsCompareHandler),
);
app.get(
  '/openapi/products/:id',
  (req: Request, res: Response, next: NextFunction) =>
    readOnly(req, res, next, productsByIdHandler),
);
app.get(
  '/openapi/combo-schemes',
  (req: Request, res: Response, next: NextFunction) =>
    readOnly(req, res, next, comboSchemesHandler),
);

app.use(express.static('dist'));
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

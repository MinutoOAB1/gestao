import { TenantMiddleware } from './tenant.middleware';
import { TenantContextService } from './tenant-context.service';
import * as jwt from 'jsonwebtoken';

describe('Suite de Testes de Segurança (Zero-Trust JWT Guard)', () => {
  let middleware: TenantMiddleware;
  let contextService: TenantContextService;
  const originalSecret = process.env.JWT_SECRET;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    contextService = new TenantContextService();
    middleware = new TenantMiddleware(contextService);
    process.env.JWT_SECRET = 'chave-secreta-de-teste-muito-segura';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
    process.env.NODE_ENV = originalNodeEnv;
  });

  test('VULN-2: deve rejeitar token com assinatura inválida e manter tenantId nulo', () => {
    // Cria um token assinado com uma chave completamente diferente/inválida
    const tokenFalso = jwt.sign({ tenantId: 'tenant-vitima' }, 'chave-totalmente-errada');
    const req: any = { headers: { authorization: `Bearer ${tokenFalso}` } };
    const res: any = {};
    
    // O next() deve ser chamado com o contexto nulo/indefinido
    const next = jest.fn(() => {
      expect(contextService.getTenantId()).toBeNull();
    });

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('VULN-2: deve extrair com sucesso o tenantId se a assinatura for perfeitamente válida', () => {
    const tenantIdReal = 'tenant-valido-1234';
    const tokenValido = jwt.sign({ tenantId: tenantIdReal }, 'chave-secreta-de-teste-muito-segura');
    const req: any = { headers: { authorization: `Bearer ${tokenValido}` } };
    const res: any = {};
    
    // O next() deve ser chamado com o contexto configurado corretamente
    const next = jest.fn(() => {
      expect(contextService.getTenantId()).toBe(tenantIdReal);
    });

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('VULN-2: deve manter o tenantId como nulo se nenhum cabeçalho for passado', () => {
    const req: any = { headers: {} };
    const res: any = {};
    const next = jest.fn(() => {
      expect(contextService.getTenantId()).toBeNull();
    });

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

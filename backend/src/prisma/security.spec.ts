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

import { InputSanitizerInterceptor } from '../common/security/input-sanitizer.interceptor';
import { of } from 'rxjs';

describe('Suite de Testes de Segurança (Input Sanitizer Interceptor)', () => {
  let interceptor: InputSanitizerInterceptor;

  beforeEach(() => {
    interceptor = new InputSanitizerInterceptor();
  });

  test('XSS-PREVENTION: deve remover tags script e manipuladores de eventos inline de corpos de request', () => {
    const inputPayload = {
      name: 'João Silva <script>alert("xss")</script>',
      description: 'Advogado Sênior',
      nested: {
        attack: 'Clique aqui <img src="x" onerror="console.log(1)"> para assinar',
        url: 'javascript:alert(123)',
      },
      arrayField: [
        'Normal text',
        'Insecure <script src="http://attacker.com/malicious.js"></script> text',
      ],
      numberField: 42,
    };

    // 🔒 SEGURANÇA: Cria uma referência de request estável para o Mock do Express
    const mockRequest = {
      body: inputPayload,
    };

    const mockExecutionContext: any = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    };

    const mockCallHandler = {
      handle: () => of(null),
    };

    // Executa a interceptação de forma síncrona
    interceptor.intercept(mockExecutionContext, mockCallHandler);

    const body = mockRequest.body;
    
    // Assegura remoção de tags <script>
    expect(body.name).toBe('João Silva ');
    expect(body.description).toBe('Advogado Sênior');
    
    // Assegura remoção de manipuladores inline no nested object
    expect(body.nested.attack).toBe('Clique aqui <img src="x" > para assinar');
    
    // Assegura remoção do protocolo javascript:
    expect(body.nested.url).toBe('');
    
    // Assegura remoção em campos de Array
    expect(body.arrayField[0]).toBe('Normal text');
    expect(body.arrayField[1]).toBe('Insecure  text');
    
    // Assegura que campos não-string (como números) permaneçam intactos
    expect(body.numberField).toBe(42);
  });
});

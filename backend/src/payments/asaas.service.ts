import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityService } from '../common/security/security.service';

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly security: SecurityService,
  ) {}

  /**
   * Returns a configured Axios instance for the given tenant.
   * If the tenant has an `asaasApiKey` saved in settings, it decrypts and uses it.
   * Otherwise, it falls back to the system global `ASAAS_API_KEY`.
   * If no API key is found, or it is a mock key, it returns a mocked API client.
   */
  private async getTenantApi(tenantId: string): Promise<AxiosInstance> {
    const settings = await this.prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    let apiKey = this.configService.get<string>('ASAAS_API_KEY')?.replace(/"/g, '').trim();

    if (settings?.asaasApiKey) {
      try {
        apiKey = this.security.decrypt(settings.asaasApiKey);
      } catch (err) {
        this.logger.error(`Erro ao descriptografar asaasApiKey para o tenant ${tenantId}: ${err.message}`);
      }
    }

    // Return a mocked API client if no key is configured or we're in mock mode
    if (!apiKey || apiKey === 'mock' || apiKey.startsWith('mock_') || apiKey.startsWith('dummy')) {
      const mockKey = apiKey || 'mock_key';
      this.logger.log(`[MOCK] Usando cliente Asaas mockado para o tenant ${tenantId}`);
      
      const mockApi = axios.create({
        baseURL: 'https://api.asaas.com/v3',
        headers: { access_token: mockKey },
      });

      mockApi.interceptors.request.use((config) => {
        config.adapter = async (cfg) => {
          this.logger.log(`[MOCK API] ${cfg.method?.toUpperCase()} ${cfg.url}`);
          let data: any = {};
          
          if (cfg.url?.includes('/customers')) {
            data = {
              object: 'customer',
              id: 'cus_' + Math.random().toString(36).substring(2, 9),
              name: 'Cliente Asaas Mock',
              email: 'cliente@mock.com',
            };
          } else if (cfg.url?.includes('/payments') && cfg.method?.toLowerCase() === 'post') {
            data = {
              object: 'payment',
              id: 'pay_' + Math.random().toString(36).substring(2, 9),
              value: 100,
              status: 'PENDING',
              invoiceUrl: 'https://sandbox.asaas.com/i/mock_invoice',
              bankSlipUrl: 'https://sandbox.asaas.com/b/mock_bankslip',
            };
          } else if (cfg.url?.includes('/pixQrCode')) {
            data = {
              encodedImage: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
              payload: '00020126580014br.gov.bcb.pix0136mockpixkey-1234-5678-9012-345678901234520400005303986540510.005802BR5915Asaas Mock Pay6009Sao Paulo62070503***6304abcd',
            };
          } else if (cfg.url?.includes('/finance/balance')) {
            data = {
              balance: 1250.75,
            };
          } else if (cfg.url?.includes('/myAccount')) {
            data = {
              name: 'Escritório de Advocacia Mock',
              email: 'advogado@mock.com',
              cpfCnpj: '12345678000190',
            };
          } else if (cfg.url?.includes('/payments') && cfg.method?.toLowerCase() === 'delete') {
            data = {
              id: cfg.url.split('/').pop(),
              status: 'CANCELLED',
            };
          } else if (cfg.url?.includes('/payments')) {
            data = {
              object: 'payment',
              id: cfg.url.split('/').pop(),
              status: 'PENDING',
            };
          }
          
          return {
            data,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: cfg,
          };
        };
        return config;
      });
      return mockApi;
    }

    const baseUrl = this.configService.get<string>('ASAAS_API_URL')?.trim() || 'https://api.asaas.com/v3';
    return axios.create({
      baseURL: baseUrl,
      headers: {
        access_token: apiKey,
      },
    });
  }

  /**
   * Tests an API key connection.
   */
  async testConnection(apiKey: string): Promise<{ success: boolean; balance: number; name: string }> {
    if (!apiKey || apiKey === 'mock' || apiKey.startsWith('mock_')) {
      return { success: true, balance: 1250.75, name: 'Escritório de Advocacia Mock' };
    }
    
    try {
      const baseUrl = this.configService.get<string>('ASAAS_API_URL')?.trim() || 'https://api.asaas.com/v3';
      const testApi = axios.create({
        baseURL: baseUrl,
        headers: { access_token: apiKey },
      });
      
      const [balanceRes, accountRes] = await Promise.all([
        testApi.get('/finance/balance'),
        testApi.get('/myAccount'),
      ]);
      
      return {
        success: true,
        balance: balanceRes.data.balance || 0,
        name: accountRes.data.name || 'Conta ASAAS',
      };
    } catch (error: any) {
      const errorMsg = error.response?.data?.errors?.[0]?.description || error.message || 'Chave de API inválida';
      throw new BadRequestException(`Erro ao conectar com Asaas: ${errorMsg}`);
    }
  }

  /**
   * Creates a subaccount under the platform account.
   */
  async createSubaccount(tenantId: string, data: any): Promise<any> {
    let apiKey = this.configService.get<string>('ASAAS_API_KEY')?.replace(/"/g, '').trim();

    // Mock subaccount creation if platform key is not configured or in mock mode
    if (!apiKey || apiKey === 'mock' || apiKey.startsWith('dummy') || apiKey.startsWith('mock_')) {
      this.logger.log(`[MOCK] Criando subconta no Asaas para o tenant ${tenantId}`);
      const mockApiKey = 'mock_asaas_key_' + Math.random().toString(36).substring(2, 15);
      const mockWalletId = 'mock_wallet_id_' + Math.random().toString(36).substring(2, 15);
      
      const encryptedAsaasKey = this.security.encrypt(mockApiKey);
      await this.prisma.tenantSettings.upsert({
        where: { tenantId },
        update: { asaasApiKey: encryptedAsaasKey, asaasWalletId: mockWalletId },
        create: { tenantId, asaasApiKey: encryptedAsaasKey, asaasWalletId: mockWalletId },
      });
      
      return {
        success: true,
        apiKey: mockApiKey,
        walletId: mockWalletId,
        name: data.name,
        email: data.email,
        isMock: true,
      };
    }

    try {
      const baseUrl = this.configService.get<string>('ASAAS_API_URL')?.trim() || 'https://api.asaas.com/v3';
      const response = await axios.post(`${baseUrl}/accounts`, {
        name: data.name,
        email: data.email,
        cpfCnpj: data.cpfCnpj?.replace(/\D/g, ''),
        phone: data.phone?.replace(/\D/g, ''),
        mobilePhone: data.mobilePhone?.replace(/\D/g, ''),
        address: data.address,
        addressNumber: data.addressNumber,
        complement: data.complement,
        province: data.province,
        postalCode: data.postalCode?.replace(/\D/g, ''),
        companyType: data.companyType,
        incomeValue: data.incomeValue || 5000,
      }, {
        headers: { access_token: apiKey },
      });
      
      const subaccount = response.data;
      const childApiKey = subaccount.apiKey;
      const childWalletId = subaccount.walletId;
      if (childApiKey) {
        const encryptedAsaasKey = this.security.encrypt(childApiKey);
        await this.prisma.tenantSettings.upsert({
          where: { tenantId },
          update: { asaasApiKey: encryptedAsaasKey, asaasWalletId: childWalletId },
          create: { tenantId, asaasApiKey: encryptedAsaasKey, asaasWalletId: childWalletId },
        });
      }
      return subaccount;
    } catch (error: any) {
      this.logger.error(`Erro ao criar subconta no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
      throw new BadRequestException(`Erro Asaas: ${error.response?.data?.errors?.[0]?.description || error.message || 'Falha ao criar subconta'}`);
    }
  }

  /**
   * Retrieves the integration status for a tenant.
   */
  async getIntegrationStatus(tenantId: string) {
    const settings = await this.prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    if (!settings?.asaasApiKey) {
      return { isConfigured: false };
    }

    const decryptedKey = this.security.decrypt(settings.asaasApiKey);
    try {
      const details = await this.testConnection(decryptedKey);
      return {
        isConfigured: true,
        balance: details.balance,
        name: details.name,
        walletId: settings.asaasWalletId,
      };
    } catch (err) {
      return {
        isConfigured: true,
        walletId: settings.asaasWalletId,
        error: 'Erro ao conectar com as credenciais salvas',
      };
    }
  }

  /**
   * Links an existing API key.
   */
  async linkAccount(tenantId: string, apiKey: string, walletId?: string) {
    // Validate connection first
    const details = await this.testConnection(apiKey);
    
    // Save key and wallet
    const encryptedKey = this.security.encrypt(apiKey);
    await this.prisma.tenantSettings.upsert({
      where: { tenantId },
      update: { asaasApiKey: encryptedKey, asaasWalletId: walletId || null },
      create: { tenantId, asaasApiKey: encryptedKey, asaasWalletId: walletId || null },
    });

    return {
      success: true,
      name: details.name,
      balance: details.balance,
      walletId,
    };
  }

  /**
   * Disconnects the Asaas integration.
   */
  async disconnect(tenantId: string) {
    await this.prisma.tenantSettings.update({
      where: { tenantId },
      data: { asaasApiKey: null, asaasWalletId: null },
    });
    return { success: true };
  }

  async getOrCreateCustomer(clientId: string, tenantId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) throw new BadRequestException('Cliente não encontrado');
    if (client.asaasCustomerId) return client.asaasCustomerId;

    if (!client.document) {
      throw new BadRequestException('O cliente não possui CPF/CNPJ cadastrado. O Asaas exige este dado.');
    }
    if (!client.email) {
      throw new BadRequestException('O cliente não possui e-mail cadastrado. O Asaas exige este dado.');
    }

    const tenantApi = await this.getTenantApi(tenantId);
    try {
      this.logger.log(`Criando cliente ${client.name} no Asaas...`);
      const response = await tenantApi.post('/customers', {
        name: client.name,
        cpfCnpj: client.document?.replace(/\D/g, ''),
        email: client.email,
        phone: client.phone?.replace(/\D/g, ''),
        mobilePhone: client.phone?.replace(/\D/g, ''),
        address: client.address,
        postalCode: client.zipCode?.replace(/\D/g, ''),
        externalReference: client.id,
        notificationDisabled: false,
      });

      const asaasId = response.data.id;
      await this.prisma.client.update({
        where: { id: clientId },
        data: { asaasCustomerId: asaasId },
      });

      return asaasId;
    } catch (error: any) {
      this.logger.error(`Erro ao criar cliente no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
      throw new BadRequestException(`Erro Asaas: ${error.response?.data?.errors?.[0]?.description || error.message || 'Falha na comunicação'}`);
    }
  }

  async createPayment(data: {
    clientId: string;
    amount: number;
    dueDate: string;
    description: string;
    billingType: 'BOLETO' | 'PIX' | 'CREDIT_CARD';
    tenantId: string;
    financialRecordId?: string;
  }) {
    const asaasCustomerId = await this.getOrCreateCustomer(data.clientId, data.tenantId);
    const tenantApi = await this.getTenantApi(data.tenantId);

    try {
      this.logger.log(`Gerando cobrança de R$ ${data.amount} para o cliente ${asaasCustomerId}...`);
      const response = await tenantApi.post('/payments', {
        customer: asaasCustomerId,
        billingType: data.billingType,
        value: data.amount,
        dueDate: data.dueDate,
        description: data.description,
        externalReference: data.tenantId,
      });

      const asaasPayment = response.data;

      const invoice = await this.prisma.invoice.create({
        data: {
          asaasId: asaasPayment.id,
          amount: data.amount,
          status: this.mapAsaasStatus(asaasPayment.status),
          dueDate: new Date(data.dueDate),
          paymentLink: asaasPayment.invoiceUrl,
          invoiceUrl: asaasPayment.invoiceUrl,
          bankSlipUrl: asaasPayment.bankSlipUrl,
          paymentMethod: data.billingType,
          clientId: data.clientId,
          tenantId: data.tenantId,
          financialRecordId: data.financialRecordId,
        },
      });

      if (data.billingType === 'PIX') {
        const pixResponse = await tenantApi.get(`/payments/${asaasPayment.id}/pixQrCode`);
        await this.prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            pixQrCode: pixResponse.data.encodedImage,
            pixText: pixResponse.data.payload,
          },
        });
      }

      return invoice;
    } catch (error: any) {
      this.logger.error(`Erro ao gerar cobrança no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
      throw new BadRequestException(`Erro Asaas: ${error.response?.data?.errors?.[0]?.description || error.message || 'Falha ao gerar cobrança'}`);
    }
  }

  async findAllInvoices(tenantId: string) {
    return this.prisma.invoice.findMany({
      where: { tenantId },
      include: {
        client: {
          select: { name: true, email: true },
        },
        financialRecord: {
          select: { description: true, category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelPayment(asaasId: string, tenantId: string) {
    const tenantApi = await this.getTenantApi(tenantId);
    try {
      await tenantApi.delete(`/payments/${asaasId}`);

      return this.prisma.invoice.update({
        where: { asaasId, tenantId },
        data: { status: 'CANCELLED' },
      });
    } catch (error: any) {
      this.logger.error(`Erro ao cancelar cobrança: ${error.message}`);
      throw new BadRequestException(`Erro ao cancelar no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async syncPaymentStatus(asaasId: string) {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { asaasId },
      });

      if (!invoice) {
        this.logger.warn(`Invoice com asaasId ${asaasId} não encontrada.`);
        return 'PENDING';
      }

      const tenantApi = await this.getTenantApi(invoice.tenantId);
      const response = await tenantApi.get(`/payments/${asaasId}`);
      const status = this.mapAsaasStatus(response.data.status);
      
      const updatedInvoice = await this.prisma.invoice.update({
        where: { asaasId },
        data: { status },
      });

      if (status === 'PAID' && updatedInvoice.financialRecordId) {
        await this.prisma.financialRecord.update({
          where: { id: updatedInvoice.financialRecordId },
          data: { status: 'PAID' },
        });
      }

      return status;
    } catch (error: any) {
      this.logger.error(`Erro ao sincronizar status: ${error.message}`);
    }
  }

  private mapAsaasStatus(asaasStatus: string): string {
    const map = {
      'PENDING': 'PENDING',
      'RECEIVED': 'PAID',
      'CONFIRMED': 'PAID',
      'RECEIVED_IN_CASH': 'PAID',
      'OVERDUE': 'OVERDUE',
      'DELETED': 'CANCELLED',
      'REFUNDED': 'CANCELLED',
      'CANCELLED': 'CANCELLED',
      'CHARGEBACK_REQUESTED': 'CANCELLED',
      'CHARGEBACK_DISPUTE': 'CANCELLED',
      'AWAITING_RISK_ANALYSIS': 'PENDING',
    };
    return map[asaasStatus] || 'PENDING';
  }
}

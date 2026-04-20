import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);
  private readonly api: AxiosInstance;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('ASAAS_API_KEY')?.replace(/"/g, '').trim();
    this.logger.log(`Inicializando AsaasService com chave: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NÃO ENCONTRADA'}`);
    this.api = axios.create({
      baseURL: 'https://api.asaas.com/v3',
      headers: {
        access_token: apiKey,
      },
    });
  }

  async getOrCreateCustomer(clientId: string, tenantId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) throw new BadRequestException('Cliente não encontrado');
    if (client.asaasCustomerId) return client.asaasCustomerId;

    // Validate mandatory fields for Asaas
    if (!client.document) {
      throw new BadRequestException('O cliente não possui CPF/CNPJ cadastrado. O Asaas exige este dado.');
    }
    if (!client.email) {
      throw new BadRequestException('O cliente não possui e-mail cadastrado. O Asaas exige este dado.');
    }

    // Create customer in Asaas
    try {
      this.logger.log(`Criando cliente ${client.name} no Asaas...`);
      const response = await this.api.post('/customers', {
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
    } catch (error) {
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

    try {
      this.logger.log(`Gerando cobrança de R$ ${data.amount} para o cliente ${asaasCustomerId}...`);
      const response = await this.api.post('/payments', {
        customer: asaasCustomerId,
        billingType: data.billingType,
        value: data.amount,
        dueDate: data.dueDate,
        description: data.description,
        externalReference: data.tenantId, // Store tenantId for webhook routing
      });

      const asaasPayment = response.data;

      // Save in our database
      const invoice = await this.prisma.invoice.create({
        data: {
          asaasId: asaasPayment.id,
          amount: data.amount,
          status: 'PENDING',
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

      // If PIX, get the QR Code
      if (data.billingType === 'PIX') {
        const pixResponse = await this.api.get(`/payments/${asaasPayment.id}/pixQrCode`);
        await this.prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            pixQrCode: pixResponse.data.encodedImage,
            pixText: pixResponse.data.payload,
          },
        });
      }

      return invoice;
    } catch (error) {
      this.logger.error(`Erro ao gerar cobrança no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
      throw new BadRequestException(`Erro Asaas: ${error.response?.data?.errors?.[0]?.description || error.message || 'Falha ao gerar cobrança'}`);
    }
  }

  async syncPaymentStatus(asaasId: string) {
    try {
      const response = await this.api.get(`/payments/${asaasId}`);
      const status = this.mapAsaasStatus(response.data.status);
      
      await this.prisma.invoice.update({
        where: { asaasId },
        data: { status },
      });

      return status;
    } catch (error) {
      this.logger.error(`Erro ao sincronizar status: ${error.message}`);
    }
  }

  private mapAsaasStatus(asaasStatus: string): string {
    const map = {
      'PENDING': 'PENDING',
      'RECEIVED': 'PAID',
      'CONFIRMED': 'PAID',
      'OVERDUE': 'OVERDUE',
      'DELETED': 'CANCELLED',
      'REFUNDED': 'CANCELLED',
    };
    return map[asaasStatus] || 'PENDING';
  }
}

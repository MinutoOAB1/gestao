import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';

@Injectable()
export class AutentiqueService {
    private readonly logger = new Logger(AutentiqueService.name);
    private readonly apiUrl = 'https://api.autentique.com.br/v2/graphql';

    async createSignatureRequest(
        apiKey: string,
        documentName: string,
        signerEmail: string,
        fileBuffer: Buffer,
        signerName?: string,
        sandbox = false
    ) {
        const query = `
            mutation CreateDocumentMutation($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) {
                createDocument(sandbox: ${sandbox}, document: $document, signers: $signers, file: $file) {
                    id
                    name
                    link
                }
            }
        `;

        const variables = {
            document: { name: documentName },
            signers: [{ email: signerEmail, name: signerName, action: 'SIGN' }],
            file: null,
        };

        const form = new FormData();
        form.append('operations', JSON.stringify({ query, variables }));
        form.append('map', JSON.stringify({ '0': ['variables.file'] }));
        form.append('0', fileBuffer, { filename: `${documentName}.pdf`, contentType: 'application/pdf' });

        try {
            const response = await axios.post(this.apiUrl, form, {
                headers: {
                    ...form.getHeaders(),
                    'Authorization': `Bearer ${apiKey}`,
                },
            });

            if (response.data.errors) {
                this.logger.error('Autentique API Error:', JSON.stringify(response.data.errors));
                throw new Error(response.data.errors[0].message);
            }

            return response.data.data.createDocument;
        } catch (error) {
            this.logger.error('Failed to create Autentique signature request:', error.message);
            throw error;
        }
    }

    async getDocumentStatus(apiKey: string, documentId: string) {
        const query = `
            query GetDocument($id: ID!) {
                document(id: $id) {
                    id
                    name
                    status
                    signatures {
                        public_id
                        name
                        email
                        signed {
                            created_at
                        }
                    }
                }
            }
        `;

        try {
            const response = await axios.post(this.apiUrl, {
                query,
                variables: { id: documentId },
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
            });

            if (response.data.errors) {
                throw new Error(response.data.errors[0].message);
            }

            return response.data.data.document;
        } catch (error) {
            this.logger.error('Failed to get Autentique document status:', error.message);
            throw error;
        }
    }
}

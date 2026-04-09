import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';

@Injectable()
export class TemplatesService {
    constructor(private prisma: PrismaService) { }

    // Extract variables from content using regex pattern {variable_name}
    private extractVariables(content: string): string[] {
        const regex = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
        const variables: string[] = [];
        let match;
        while ((match = regex.exec(content)) !== null) {
            if (!variables.includes(match[1])) {
                variables.push(match[1]);
            }
        }
        return variables;
    }

    async findAll(tenantId: string, category?: string, search?: string) {
        const where: any = { tenantId };

        if (category && category !== 'Todos') {
            where.category = category.toUpperCase();
        }

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
                { content: { contains: search } },
                { variables: { contains: search } },
            ];
        }

        return this.prisma.template.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
        });
    }

    async findOne(id: string, tenantId: string) {
        return this.prisma.template.findFirst({
            where: { id, tenantId },
        });
    }

    async create(tenantId: string, dto: CreateTemplateDto) {
        const variables = dto.content ? this.extractVariables(dto.content) :
            dto.variables ? JSON.parse(dto.variables) : [];

        return this.prisma.template.create({
            data: {
                title: dto.title,
                description: dto.description || '',
                content: dto.content || '',
                category: dto.category,
                icon: dto.icon || 'FileText',
                iconColor: dto.iconColor || 'blue',
                docxPath: dto.docxPath,
                variables: dto.variables || JSON.stringify(variables),
                tenantId,
            } as any,
        });
    }

    async update(id: string, tenantId: string, dto: UpdateTemplateDto) {
        let variables: string[] | undefined;
        if (dto.content) {
            variables = this.extractVariables(dto.content);
        }

        return this.prisma.template.update({
            where: { id },
            data: {
                ...dto,
                ...(variables && { variables: JSON.stringify(variables) }),
            },
        });
    }

    async remove(id: string, tenantId: string) {
        return this.prisma.template.delete({
            where: { id },
        });
    }

    async fillTemplate(
        id: string,
        tenantId: string,
        variableValues: Record<string, string>
    ): Promise<{ filledContent: string; missingVariables: string[] }> {
        const template = await this.findOne(id, tenantId);
        if (!template) {
            throw new Error('Template not found');
        }

        let filledContent = template.content;
        const missingVariables: string[] = [];
        const templateVariables = template.variables
            ? JSON.parse(template.variables)
            : [];

        for (const variable of templateVariables) {
            const value = variableValues[variable];
            if (value !== undefined && value !== null) {
                const regex = new RegExp(`\\{${variable}\\}`, 'g');
                filledContent = filledContent.replace(regex, value);
            } else {
                missingVariables.push(variable);
            }
        }

        return { filledContent, missingVariables };
    }
}

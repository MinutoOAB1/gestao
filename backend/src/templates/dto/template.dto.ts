import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTemplateDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsNotEmpty()
    @IsString()
    category: string;

    @IsOptional()
    @IsString()
    icon?: string;

    @IsOptional()
    @IsString()
    iconColor?: string;

    @IsOptional()
    @IsString()
    docxPath?: string;

    @IsOptional()
    @IsString()
    variables?: string;
}

export class UpdateTemplateDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    icon?: string;

    @IsOptional()
    @IsString()
    iconColor?: string;

    @IsOptional()
    @IsString()
    docxPath?: string;

    @IsOptional()
    @IsString()
    variables?: string;
}

export class FillTemplateDto {
    @IsNotEmpty()
    variables: Record<string, string>;
}

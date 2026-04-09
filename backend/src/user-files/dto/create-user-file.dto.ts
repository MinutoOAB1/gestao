export class CreateUserFileDto {
    name: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    url: string;
    folder?: string;
}

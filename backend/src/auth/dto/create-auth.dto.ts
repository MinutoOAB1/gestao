export class RegisterDto {
    name: string;
    email: string;
    password: string;
    companyName: string; // Tenant Name
}

export class LoginDto {
    email: string;
    password: string;
    twoFactorCode?: string; // Optional 2FA code
}


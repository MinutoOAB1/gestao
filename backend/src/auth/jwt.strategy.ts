import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        const secret = process.env.JWT_SECRET;
        if (!secret && process.env.NODE_ENV === 'production') {
            throw new Error('FATAL: JWT_SECRET environment variable is missing in production!');
        }
        
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            // 🔒 SEGURANÇA [VULN-3]: Impede o uso de chave padrão em ambiente de produção
            secretOrKey: secret || 'super-secret',
        });
    }

    async validate(payload: any) {
        return { sub: payload.sub, email: payload.email, tenantId: payload.tenantId, role: payload.role };
    }
}

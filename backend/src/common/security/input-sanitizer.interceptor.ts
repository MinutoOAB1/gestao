import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class InputSanitizerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    if (request && request.body) {
      request.body = this.sanitize(request.body);
    }
    return next.handle();
  }

  private sanitize(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitize(item));
    }

    if (typeof obj === 'object') {
      // Prevent sanitizing specialized objects like Buffer or class instances that shouldn't be traversed recursively
      if (obj.constructor && obj.constructor.name !== 'Object' && obj.constructor.name !== 'Array') {
        return obj;
      }

      const sanitizedObj: any = {};
      for (const key of Object.keys(obj)) {
        sanitizedObj[key] = this.sanitize(obj[key]);
      }
      return sanitizedObj;
    }

    return obj;
  }

  private sanitizeString(val: string): string {
    // 🔒 SEGURANÇA [XSS-PREVENTION]: Remove de forma recursiva tags de script, manipuladores de eventos e javascript: URI
    let sanitized = val;
    
    // 1. Remove tags de script e seus conteúdos
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // 2. Remove manipuladores de eventos inline (ex: onload, onerror, onclick, onmouseover)
    sanitized = sanitized.replace(/on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]*)/gi, '');
    
    // 3. Remove URIs contendo o protocolo javascript:
    sanitized = sanitized.replace(/javascript\s*:\s*[^\s>]+/gi, '');

    return sanitized;
  }
}

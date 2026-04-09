import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './roles.enum';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true; // If no roles are required, allow access
        }

        const { user } = context.switchToHttp().getRequest();

        // If no user attached (should utilize AuthGuard('jwt') before this), deny
        if (!user || !user.role) {
            return false;
        }

        // Admin has access to everything? Or should we make it explicit? 
        // Usually Admin should bypass, but let's stick to explicit first.
        // Actually, let's allow ADMIN to access everything if they have the role.
        if (user.role === Role.ADMIN) {
            return true;
        }

        return requiredRoles.some((role) => user.role === role);
    }
}

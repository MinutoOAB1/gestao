import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { FinancialCategoryService } from './financial-category.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('financial-categories')
@UseGuards(JwtAuthGuard)
export class FinancialCategoryController {
    constructor(private readonly categoryService: FinancialCategoryService) {}

    @Get()
    findAll(@Request() req) {
        return this.categoryService.findAll(req.user.tenantId);
    }

    @Post()
    create(@Request() req, @Body() data: any) {
        return this.categoryService.create(data, req.user.tenantId);
    }

    @Post('seed')
    seed(@Request() req) {
        return this.categoryService.seedDefaults(req.user.tenantId);
    }
}

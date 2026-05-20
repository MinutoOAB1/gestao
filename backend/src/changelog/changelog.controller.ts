import { Controller, Get, UseGuards } from '@nestjs/common';
import { ChangelogService } from './changelog.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('changelog')
@UseGuards(JwtAuthGuard)
export class ChangelogController {
    constructor(private readonly changelogService: ChangelogService) { }

    @Get()
    async getChangelogs() {
        return this.changelogService.findAll();
    }
}

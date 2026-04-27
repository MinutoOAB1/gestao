import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, Put } from '@nestjs/common';
import { ProcessesService } from './processes.service';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../auth/roles.enum';

@Controller('processes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProcessesController {
  constructor(private readonly processesService: ProcessesService) { }

  // ══════════════════════════════════════════════════════════
  // STATIC ROUTES FIRST (must come before :id param routes)
  // ══════════════════════════════════════════════════════════

  // ─── Labels (static) ─────────────────────────────────────

  @Get('labels/all')
  getLabels(@Request() req) {
    return this.processesService.getLabels(req.user.tenantId);
  }

  @Post('labels')
  createLabel(@Request() req, @Body() body: { name: string; color: string }) {
    return this.processesService.createLabel(req.user.tenantId, body.name, body.color);
  }

  @Delete('labels/:labelId')
  deleteLabel(@Request() req, @Param('labelId') labelId: string) {
    return this.processesService.deleteLabel(labelId, req.user.tenantId);
  }

  // ─── Checklists (static) ─────────────────────────────────

  @Delete('checklists/:checklistId')
  deleteChecklist(@Request() req, @Param('checklistId') checklistId: string) {
    return this.processesService.deleteChecklist(checklistId, req.user.tenantId);
  }

  @Post('checklists/:checklistId/items')
  addChecklistItem(@Request() req, @Param('checklistId') checklistId: string, @Body() body: { text: string }) {
    return this.processesService.addChecklistItem(checklistId, body.text, req.user.tenantId);
  }

  @Patch('checklist-items/:itemId')
  updateChecklistItem(@Request() req, @Param('itemId') itemId: string, @Body() body: { text?: string; completed?: boolean }) {
    return this.processesService.updateChecklistItem(itemId, body, req.user.tenantId);
  }

  @Delete('checklist-items/:itemId')
  deleteChecklistItem(@Request() req, @Param('itemId') itemId: string) {
    return this.processesService.deleteChecklistItem(itemId, req.user.tenantId);
  }

  // ─── Comments (static) ───────────────────────────────────

  @Delete('comments/:commentId')
  deleteComment(@Request() req, @Param('commentId') commentId: string) {
    return this.processesService.deleteComment(commentId, req.user.tenantId);
  }

  // ══════════════════════════════════════════════════════════
  // PARAMETERIZED ROUTES (:id)
  // ══════════════════════════════════════════════════════════

  // ─── Process CRUD ────────────────────────────────────────

  @Post()
  create(@Request() req, @Body() createProcessDto: CreateProcessDto) {
    return this.processesService.create(createProcessDto, req.user.tenantId, req.user.sub);
  }

  @Get()
  @Get('filter')
  @Post('filter')
  @Roles(Role.ADMIN, Role.LAWYER)
  async findAll(
    @Request() req,
    @Query('tribunal') tribunal?: string,
    @Query('court') court?: string,
    @Query('area') area?: string,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
    @Query('processId') processId?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Body() body?: any,
  ) {
    const take = limit ? parseInt(limit) : 50;
    const skip = page ? (parseInt(page) - 1) * take : 0;
    const filters = { tribunal: tribunal || body?.tribunal, court: court || body?.court, area: area || body?.area, status: status || body?.status, clientId: clientId || body?.clientId, processId: processId || body?.processId };
    const result = await this.processesService.findAll(req.user.tenantId, filters, take, skip);
    return result;
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.processesService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateProcessDto: UpdateProcessDto) {
    return this.processesService.update(id, updateProcessDto, req.user.tenantId, req.user.sub);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.LAWYER)
  remove(@Request() req, @Param('id') id: string) {
    return this.processesService.remove(id, req.user.tenantId, req.user.sub);
  }

  @Patch(':id/move')
  @Post(':id/move')
  @Put(':id/move')
  move(@Request() req, @Param('id') id: string, @Body() body: { column: string; order?: number }) {
    return this.processesService.update(id, { kanbanColumn: body.column, kanbanOrder: body.order } as any, req.user.tenantId, req.user.sub);
  }

  // ─── Process sub-resources (:id/*) ───────────────────────

  @Post(':id/checklists')
  createChecklist(@Request() req, @Param('id') id: string, @Body() body: { title?: string }) {
    return this.processesService.createChecklist(id, body.title || 'Checklist', req.user.tenantId);
  }

  @Post(':id/labels/:labelId')
  addLabelToProcess(@Request() req, @Param('id') id: string, @Param('labelId') labelId: string) {
    return this.processesService.addLabelToProcess(id, labelId, req.user.tenantId);
  }

  @Delete(':id/labels/:labelId')
  removeLabelFromProcess(@Request() req, @Param('id') id: string, @Param('labelId') labelId: string) {
    return this.processesService.removeLabelFromProcess(id, labelId, req.user.tenantId);
  }

  @Get(':id/comments')
  getComments(@Request() req, @Param('id') id: string) {
    return this.processesService.getComments(id, req.user.tenantId);
  }

  @Post(':id/comments')
  addComment(@Request() req, @Param('id') id: string, @Body() body: { content: string }) {
    return this.processesService.addComment(id, req.user.sub, body.content, req.user.tenantId);
  }
}

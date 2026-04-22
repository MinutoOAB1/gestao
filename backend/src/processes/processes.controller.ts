import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
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
  deleteLabel(@Param('labelId') labelId: string) {
    return this.processesService.deleteLabel(labelId);
  }

  // ─── Checklists (static) ─────────────────────────────────

  @Delete('checklists/:checklistId')
  deleteChecklist(@Param('checklistId') checklistId: string) {
    return this.processesService.deleteChecklist(checklistId);
  }

  @Post('checklists/:checklistId/items')
  addChecklistItem(@Param('checklistId') checklistId: string, @Body() body: { text: string }) {
    return this.processesService.addChecklistItem(checklistId, body.text);
  }

  @Patch('checklist-items/:itemId')
  updateChecklistItem(@Param('itemId') itemId: string, @Body() body: { text?: string; completed?: boolean }) {
    return this.processesService.updateChecklistItem(itemId, body);
  }

  @Delete('checklist-items/:itemId')
  deleteChecklistItem(@Param('itemId') itemId: string) {
    return this.processesService.deleteChecklistItem(itemId);
  }

  // ─── Comments (static) ───────────────────────────────────

  @Delete('comments/:commentId')
  deleteComment(@Param('commentId') commentId: string) {
    return this.processesService.deleteComment(commentId);
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
  findAll(@Request() req) {
    return this.processesService.findAll(req.user.tenantId);
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
  getComments(@Param('id') id: string) {
    return this.processesService.getComments(id);
  }

  @Post(':id/comments')
  addComment(@Request() req, @Param('id') id: string, @Body() body: { content: string }) {
    return this.processesService.addComment(id, req.user.sub, body.content);
  }
}

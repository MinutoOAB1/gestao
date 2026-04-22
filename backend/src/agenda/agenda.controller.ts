import { Controller, Get, Post, Body, Patch, Param, Delete, Request, Query, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import { UpdateAgendaDto } from './dto/update-agenda.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('agenda')
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) { }

  // Create new event with assignees
  @Post()
  create(@Request() req, @Body() createAgendaDto: CreateAgendaDto) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
    const userId = req.user?.sub;
    if (!userId) throw new UnauthorizedException('User ID not found in session');
    const userName = req.user?.name || 'Sistema';
    return this.agendaService.create(createAgendaDto, tenantId, userId, userName);
  }

  // Get all events (shared calendar view)
  @Get()
  findAll(@Request() req) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
    return this.agendaService.findAllShared(tenantId);
  }

  // Get events assigned to current user or created by them
  @Get('my')
  findMyEvents(@Request() req) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
    const userId = req.user?.sub;
    if (!userId) throw new UnauthorizedException('User ID not found in session');
    return this.agendaService.findByUser(tenantId, userId);
  }

  // Get events for a specific user
  @Get('user/:userId')
  findByUser(@Request() req, @Param('userId') userId: string) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
    return this.agendaService.findByUser(tenantId, userId);
  }

  // Get upcoming deadlines
  @Get('deadlines')
  getDeadlines(@Request() req) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
    const userId = req.user?.sub;
    return this.agendaService.getUpcomingDeadlines(tenantId, userId);
  }

  // Get single event
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
    return this.agendaService.findOne(id, tenantId);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateAgendaDto: UpdateAgendaDto) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
    return this.agendaService.update(id, updateAgendaDto, tenantId, req.user.sub);
  }

  @Patch(':id/complete')
  toggleComplete(@Request() req, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
    return this.agendaService.toggleComplete(id, tenantId);
  }

  @Patch(':id/assignee-status')
  updateAssigneeStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { status: string }
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
    const userId = req.user?.sub;
    if (!userId) throw new UnauthorizedException('User ID not found in session');
    return this.agendaService.updateAssigneeStatus(id, userId, body.status, tenantId);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
    return this.agendaService.remove(id, tenantId, req.user.sub);
  }

  // Add checklist item
  @Post(':id/checklist')
  addChecklistItem(@Request() req, @Param('id') id: string, @Body() body: { text: string }) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
    return this.agendaService.addChecklistItem(id, body.text, tenantId);
  }

  // Toggle checklist item status
  @Patch('checklist/:itemId/toggle')
  toggleChecklistItem(@Request() req, @Param('itemId') itemId: string) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
    return this.agendaService.toggleChecklistItem(itemId, tenantId);
  }

  // Delete checklist item
  @Delete('checklist/:itemId')
  removeChecklistItem(@Request() req, @Param('itemId') itemId: string) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
    return this.agendaService.removeChecklistItem(itemId, tenantId);
  }
}

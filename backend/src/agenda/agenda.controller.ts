import { Controller, Get, Post, Body, Patch, Param, Delete, Request, Query } from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import { UpdateAgendaDto } from './dto/update-agenda.dto';

// Development: Endpoints work without auth, using a default tenant
const DEV_TENANT_ID = 'dev-tenant-001';
const DEV_USER_ID = 'dev-user-001';

@Controller('agenda')
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) { }

  // Create new event with assignees
  @Post()
  create(@Request() req, @Body() createAgendaDto: CreateAgendaDto) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    const userId = req.user?.id || DEV_USER_ID;
    const userName = req.user?.name || 'Sistema';
    return this.agendaService.create(createAgendaDto, tenantId, userId, userName);
  }

  // Get all events (shared calendar view)
  @Get()
  findAll(@Request() req) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    return this.agendaService.findAllShared(tenantId);
  }

  // Get events assigned to current user or created by them
  @Get('my')
  findMyEvents(@Request() req) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    const userId = req.user?.id || DEV_USER_ID;
    return this.agendaService.findByUser(tenantId, userId);
  }

  // Get events for a specific user
  @Get('user/:userId')
  findByUser(@Request() req, @Param('userId') userId: string) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    return this.agendaService.findByUser(tenantId, userId);
  }

  // Get upcoming deadlines
  @Get('deadlines')
  getDeadlines(@Request() req) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    const userId = req.user?.id;
    return this.agendaService.getUpcomingDeadlines(tenantId, userId);
  }

  // Get single event
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    return this.agendaService.findOne(id, tenantId);
  }

  // Update event
  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateAgendaDto: UpdateAgendaDto) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    return this.agendaService.update(id, updateAgendaDto, tenantId);
  }

  // Toggle completed status
  @Patch(':id/complete')
  toggleComplete(@Request() req, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    return this.agendaService.toggleComplete(id, tenantId);
  }

  // Update assignee status (accept/decline)
  @Patch(':id/assignee-status')
  updateAssigneeStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { status: string }
  ) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    const userId = req.user?.id || DEV_USER_ID;
    return this.agendaService.updateAssigneeStatus(id, userId, body.status, tenantId);
  }

  // Delete event
  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    return this.agendaService.remove(id, tenantId);
  }

  // Add checklist item
  @Post(':id/checklist')
  addChecklistItem(@Request() req, @Param('id') id: string, @Body() body: { text: string }) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    return this.agendaService.addChecklistItem(id, body.text, tenantId);
  }

  // Toggle checklist item status
  @Patch('checklist/:itemId/toggle')
  toggleChecklistItem(@Request() req, @Param('itemId') itemId: string) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    return this.agendaService.toggleChecklistItem(itemId, tenantId);
  }

  // Delete checklist item
  @Delete('checklist/:itemId')
  removeChecklistItem(@Request() req, @Param('itemId') itemId: string) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    return this.agendaService.removeChecklistItem(itemId, tenantId);
  }
}

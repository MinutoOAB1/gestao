import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

// Development: Endpoints work without auth, using default tenant and user
const DEV_TENANT_ID = 'dev-tenant-001';
const DEV_USER_ID = 'dev-user-001';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) { }

  // Global audit endpoint (MUST be before :id routes)
  @Get('audit/all')
  getAllAuditLogs(@Request() req) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    return this.documentsService.getAllAuditLogs(tenantId);
  }

  @Get()
  findAll(@Request() req, @Query('folderId') folderId?: string) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    return this.documentsService.findAll(tenantId, folderId);
  }

  // Folder Endpoints
  @Post('folders')
  createFolder(@Request() req, @Body() body: { name: string; parentId?: string }) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    return this.documentsService.createFolder(body.name, body.parentId, tenantId);
  }

  @Get('folders')
  findAllFolders(@Request() req, @Query('parentId') parentId?: string) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    return this.documentsService.findAllFolders(tenantId, parentId);
  }

  @Delete('folders/:id')
  removeFolder(@Request() req, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    return this.documentsService.removeFolder(id, tenantId);
  }

  @Post('folders/:id/lock')
  toggleFolderLock(@Request() req, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    return this.documentsService.toggleFolderLock(id, tenantId);
  }


  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateDocumentDto: UpdateDocumentDto) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    return this.documentsService.update(id, updateDocumentDto, tenantId);
  }

  // Advanced Features Endpoints

  @Patch(':id/status')
  updateStatus(@Request() req, @Param('id') id: string, @Body('status') status: string) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    const userId = req.user?.id || DEV_USER_ID;
    return this.documentsService.updateStatus(id, status, tenantId, userId);
  }

  @Post(':id/lock')
  toggleLock(@Request() req, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    const userId = req.user?.id || DEV_USER_ID;
    return this.documentsService.toggleLock(id, tenantId, userId);
  }

  @Patch(':id/permissions')
  setPermissions(@Request() req, @Param('id') id: string, @Body('allowedRoles') allowedRoles: string) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    const userId = req.user?.id || DEV_USER_ID;
    return this.documentsService.setPermissions(id, allowedRoles, tenantId, userId);
  }

  @Get(':id/audit')
  getAuditLogs(@Request() req, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    return this.documentsService.getAuditLogs(id, tenantId);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    const userId = req.user?.id || DEV_USER_ID;
    return this.documentsService.remove(id, tenantId, userId);
  }

  @Post()
  create(@Request() req, @Body() createDocumentDto: CreateDocumentDto) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    const userId = req.user?.id || DEV_USER_ID;
    return this.documentsService.create(createDocumentDto, tenantId, userId);
  }

  // Comment Endpoints

  @Post(':id/comments')
  addComment(@Request() req, @Param('id') id: string, @Body('content') content: string) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    const userId = req.user?.id || DEV_USER_ID;
    return this.documentsService.addComment(id, content, userId, tenantId);
  }

  @Get(':id/comments')
  findComments(@Request() req, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    return this.documentsService.findComments(id, tenantId);
  }

  @Delete('comments/:commentId')
  deleteComment(@Request() req, @Param('commentId') commentId: string) {
    const tenantId = req.user?.tenantId || DEV_TENANT_ID;
    const userId = req.user?.id || DEV_USER_ID;
    return this.documentsService.deleteComment(commentId, userId, tenantId);
  }
}


Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.19.1
 * Query Engine version: 69d742ee20b815d88e17e54db4a2a7a3b30324e3
 */
Prisma.prismaVersion = {
  client: "5.19.1",
  engine: "69d742ee20b815d88e17e54db4a2a7a3b30324e3"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}

/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.TenantScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  storageQuotaGb: 'storageQuotaGb',
  usedStorageMb: 'usedStorageMb',
  maxUsers: 'maxUsers'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  password: 'password',
  name: 'name',
  role: 'role',
  avatar: 'avatar',
  cpf: 'cpf',
  birthDate: 'birthDate',
  bio: 'bio',
  phone: 'phone',
  mobile: 'mobile',
  address: 'address',
  oabNumber: 'oabNumber',
  oabState: 'oabState',
  specialties: 'specialties',
  twoFactorSecret: 'twoFactorSecret',
  twoFactorEnabled: 'twoFactorEnabled',
  permissions: 'permissions',
  tenantId: 'tenantId',
  storageQuotaGb: 'storageQuotaGb',
  usedStorageMb: 'usedStorageMb',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  type: 'type',
  title: 'title',
  message: 'message',
  isRead: 'isRead',
  entityType: 'entityType',
  entityId: 'entityId',
  userId: 'userId',
  createdById: 'createdById',
  tenantId: 'tenantId',
  createdAt: 'createdAt'
};

exports.Prisma.ProcessScalarFieldEnum = {
  id: 'id',
  number: 'number',
  title: 'title',
  description: 'description',
  status: 'status',
  value: 'value',
  court: 'court',
  area: 'area',
  deadline: 'deadline',
  assignedTo: 'assignedTo',
  kanbanColumn: 'kanbanColumn',
  kanbanOrder: 'kanbanOrder',
  clientId: 'clientId',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProcessNoteScalarFieldEnum = {
  id: 'id',
  content: 'content',
  color: 'color',
  isPinned: 'isPinned',
  processId: 'processId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProcessUpdateScalarFieldEnum = {
  id: 'id',
  date: 'date',
  description: 'description',
  type: 'type',
  isImportant: 'isImportant',
  processId: 'processId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProcessChecklistScalarFieldEnum = {
  id: 'id',
  title: 'title',
  processId: 'processId',
  createdAt: 'createdAt'
};

exports.Prisma.ProcessChecklistItemScalarFieldEnum = {
  id: 'id',
  text: 'text',
  completed: 'completed',
  order: 'order',
  checklistId: 'checklistId'
};

exports.Prisma.ProcessLabelScalarFieldEnum = {
  id: 'id',
  name: 'name',
  color: 'color',
  tenantId: 'tenantId',
  createdAt: 'createdAt'
};

exports.Prisma.ProcessCommentScalarFieldEnum = {
  id: 'id',
  content: 'content',
  processId: 'processId',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.ClientScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  phone: 'phone',
  document: 'document',
  address: 'address',
  leadSource: 'leadSource',
  referredBy: 'referredBy',
  demandType: 'demandType',
  demandSummary: 'demandSummary',
  factsDescription: 'factsDescription',
  urgencyLevel: 'urgencyLevel',
  rg: 'rg',
  birthDate: 'birthDate',
  city: 'city',
  state: 'state',
  zipCode: 'zipCode',
  occupation: 'occupation',
  leadStatus: 'leadStatus',
  nextAction: 'nextAction',
  nextActionDate: 'nextActionDate',
  internalNotes: 'internalNotes',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  status: 'status',
  customFields: 'customFields'
};

exports.Prisma.ClientTagScalarFieldEnum = {
  id: 'id',
  name: 'name',
  color: 'color',
  order: 'order',
  clientId: 'clientId',
  tenantId: 'tenantId',
  createdAt: 'createdAt'
};

exports.Prisma.ClientNoteScalarFieldEnum = {
  id: 'id',
  content: 'content',
  priority: 'priority',
  isUrgent: 'isUrgent',
  clientId: 'clientId',
  createdBy: 'createdBy',
  createdById: 'createdById',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ClientServiceLogScalarFieldEnum = {
  id: 'id',
  date: 'date',
  type: 'type',
  durationMinutes: 'durationMinutes',
  summary: 'summary',
  clientId: 'clientId',
  tenantId: 'tenantId',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ClientChecklistItemScalarFieldEnum = {
  id: 'id',
  text: 'text',
  completed: 'completed',
  clientId: 'clientId',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FinancialRecordScalarFieldEnum = {
  id: 'id',
  type: 'type',
  category: 'category',
  amount: 'amount',
  description: 'description',
  date: 'date',
  status: 'status',
  isRecurring: 'isRecurring',
  recurrenceType: 'recurrenceType',
  totalInstallments: 'totalInstallments',
  currentInstallment: 'currentInstallment',
  recurringEndDate: 'recurringEndDate',
  parentRecordId: 'parentRecordId',
  isUrgent: 'isUrgent',
  tenantId: 'tenantId',
  clientId: 'clientId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  notes: 'notes'
};

exports.Prisma.FolderScalarFieldEnum = {
  id: 'id',
  name: 'name',
  parentId: 'parentId',
  tenantId: 'tenantId',
  isLocked: 'isLocked',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DocumentScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  size: 'size',
  url: 'url',
  folderId: 'folderId',
  tenantId: 'tenantId',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  kanbanStatus: 'kanbanStatus',
  isLocked: 'isLocked',
  allowedRoles: 'allowedRoles'
};

exports.Prisma.DocumentCommentScalarFieldEnum = {
  id: 'id',
  content: 'content',
  documentId: 'documentId',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DocumentAuditLogScalarFieldEnum = {
  id: 'id',
  action: 'action',
  details: 'details',
  documentId: 'documentId',
  userId: 'userId',
  userName: 'userName',
  tenantId: 'tenantId',
  createdAt: 'createdAt'
};

exports.Prisma.EventScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  start: 'start',
  end: 'end',
  type: 'type',
  color: 'color',
  completed: 'completed',
  priority: 'priority',
  location: 'location',
  reminderMinutes: 'reminderMinutes',
  createdById: 'createdById',
  createdByName: 'createdByName',
  processId: 'processId',
  processNumber: 'processNumber',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  status: 'status',
  reminderSent: 'reminderSent',
  clientId: 'clientId',
  clientName: 'clientName'
};

exports.Prisma.EventChecklistItemScalarFieldEnum = {
  id: 'id',
  text: 'text',
  completed: 'completed',
  order: 'order',
  eventId: 'eventId',
  createdAt: 'createdAt'
};

exports.Prisma.EventAssigneeScalarFieldEnum = {
  id: 'id',
  eventId: 'eventId',
  userId: 'userId',
  userName: 'userName',
  userEmail: 'userEmail',
  status: 'status',
  createdAt: 'createdAt'
};

exports.Prisma.ContractScalarFieldEnum = {
  id: 'id',
  number: 'number',
  title: 'title',
  description: 'description',
  status: 'status',
  value: 'value',
  clientId: 'clientId',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  area: 'area'
};

exports.Prisma.PartnershipScalarFieldEnum = {
  id: 'id',
  name: 'name',
  initials: 'initials',
  type: 'type',
  percentage: 'percentage',
  fixedAmount: 'fixedAmount',
  color: 'color',
  email: 'email',
  phone: 'phone',
  notes: 'notes',
  active: 'active',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PartnershipTransactionScalarFieldEnum = {
  id: 'id',
  amount: 'amount',
  description: 'description',
  status: 'status',
  dueDate: 'dueDate',
  paidDate: 'paidDate',
  partnerId: 'partnerId',
  financialRecordId: 'financialRecordId',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TemplateScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  content: 'content',
  category: 'category',
  icon: 'icon',
  iconColor: 'iconColor',
  variables: 'variables',
  docxPath: 'docxPath',
  previewImagePath: 'previewImagePath',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ChatChannelScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  processId: 'processId',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ChatMessageScalarFieldEnum = {
  id: 'id',
  content: 'content',
  senderId: 'senderId',
  senderName: 'senderName',
  senderAvatar: 'senderAvatar',
  channelId: 'channelId',
  fileName: 'fileName',
  fileUrl: 'fileUrl',
  fileSize: 'fileSize',
  fileType: 'fileType',
  replyToId: 'replyToId',
  reactions: 'reactions',
  isPinned: 'isPinned',
  createdAt: 'createdAt'
};

exports.Prisma.DirectMessageScalarFieldEnum = {
  id: 'id',
  content: 'content',
  senderId: 'senderId',
  senderName: 'senderName',
  senderAvatar: 'senderAvatar',
  recipientId: 'recipientId',
  tenantId: 'tenantId',
  isRead: 'isRead',
  createdAt: 'createdAt'
};

exports.Prisma.TenantSettingsScalarFieldEnum = {
  id: 'id',
  officeName: 'officeName',
  cnpj: 'cnpj',
  email: 'email',
  website: 'website',
  language: 'language',
  timezone: 'timezone',
  dateFormat: 'dateFormat',
  emailNotifications: 'emailNotifications',
  processUpdates: 'processUpdates',
  deadlineReminders: 'deadlineReminders',
  twoFactor: 'twoFactor',
  loginAlerts: 'loginAlerts',
  tenantId: 'tenantId',
  letterheadUrl: 'letterheadUrl'
};

exports.Prisma.TimeEntryScalarFieldEnum = {
  id: 'id',
  description: 'description',
  duration: 'duration',
  date: 'date',
  processId: 'processId',
  processTitle: 'processTitle',
  userId: 'userId',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AiAnalysisLogScalarFieldEnum = {
  id: 'id',
  contractName: 'contractName',
  contractText: 'contractText',
  analysisResult: 'analysisResult',
  overallScore: 'overallScore',
  userId: 'userId',
  tenantId: 'tenantId',
  createdAt: 'createdAt'
};

exports.Prisma.LoginHistoryScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  deviceHash: 'deviceHash',
  location: 'location',
  success: 'success',
  createdAt: 'createdAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  action: 'action',
  entityType: 'entityType',
  entityId: 'entityId',
  userId: 'userId',
  userName: 'userName',
  tenantId: 'tenantId',
  details: 'details',
  oldValues: 'oldValues',
  newValues: 'newValues',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  createdAt: 'createdAt'
};

exports.Prisma.UserFileScalarFieldEnum = {
  id: 'id',
  name: 'name',
  fileName: 'fileName',
  mimeType: 'mimeType',
  sizeBytes: 'sizeBytes',
  url: 'url',
  folder: 'folder',
  userId: 'userId',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};


exports.Prisma.ModelName = {
  Tenant: 'Tenant',
  User: 'User',
  Notification: 'Notification',
  Process: 'Process',
  ProcessNote: 'ProcessNote',
  ProcessUpdate: 'ProcessUpdate',
  ProcessChecklist: 'ProcessChecklist',
  ProcessChecklistItem: 'ProcessChecklistItem',
  ProcessLabel: 'ProcessLabel',
  ProcessComment: 'ProcessComment',
  Client: 'Client',
  ClientTag: 'ClientTag',
  ClientNote: 'ClientNote',
  ClientServiceLog: 'ClientServiceLog',
  ClientChecklistItem: 'ClientChecklistItem',
  FinancialRecord: 'FinancialRecord',
  Folder: 'Folder',
  Document: 'Document',
  DocumentComment: 'DocumentComment',
  DocumentAuditLog: 'DocumentAuditLog',
  Event: 'Event',
  EventChecklistItem: 'EventChecklistItem',
  EventAssignee: 'EventAssignee',
  Contract: 'Contract',
  Partnership: 'Partnership',
  PartnershipTransaction: 'PartnershipTransaction',
  Template: 'Template',
  ChatChannel: 'ChatChannel',
  ChatMessage: 'ChatMessage',
  DirectMessage: 'DirectMessage',
  TenantSettings: 'TenantSettings',
  TimeEntry: 'TimeEntry',
  AiAnalysisLog: 'AiAnalysisLog',
  LoginHistory: 'LoginHistory',
  AuditLog: 'AuditLog',
  UserFile: 'UserFile'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)

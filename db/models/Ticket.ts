import {
  Table,
  Column,
  Model,
  BelongsTo,
  ForeignKey,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Company } from './Company';
import { User, UserRole } from './User';

export enum TicketStatus {
  open = 'open',
  resolved = 'resolved',
}

export enum TicketType {
  managementReport = 'managementReport',
  registrationAddressChange = 'registrationAddressChange',
  strikeOff = 'strikeOff',
}

export enum TicketCategory {
  accounting = 'accounting',
  corporate = 'registrationAddressChange',
  management = 'management',
}

export const TicketCategoryByType: Record<TicketType, TicketCategory> = {
  [TicketType.managementReport]: TicketCategory.accounting,
  [TicketType.registrationAddressChange]: TicketCategory.corporate,
  [TicketType.strikeOff]: TicketCategory.management,
}

export const UserRoleByTicketType: Record<TicketType, UserRole> = {
  [TicketType.managementReport]: UserRole.accountant,
  [TicketType.registrationAddressChange]: UserRole.corporateSecretary,
  [TicketType.strikeOff]: UserRole.director,
}

@Table({ tableName: 'tickets' })
export class Ticket extends Model {
  @AutoIncrement
  @PrimaryKey
  @Column
  declare id: number;

  @Column
  declare type: TicketType;

  @Column
  declare status: TicketStatus;

  @Column
  declare category: TicketCategory;

  @ForeignKey(() => Company)
  declare companyId: number;

  @ForeignKey(() => User)
  declare assigneeId: number;

  @BelongsTo(() => Company)
  company: Company;

  @BelongsTo(() => User)
  assignee: User;
}

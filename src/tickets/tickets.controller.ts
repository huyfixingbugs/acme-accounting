import { Body, ConflictException, Controller, Get, Post } from '@nestjs/common';
import { Company } from '../../db/models/Company';
import {
  Ticket,
  TicketCategory,
  TicketStatus,
  TicketType,
  TicketCategoryByType,
  UserRoleByTicketType
} from '../../db/models/Ticket';
import { User, UserRole } from '../../db/models/User';
import { Op } from 'sequelize';

interface newTicketDto {
  type: TicketType;
  companyId: number;
}

interface TicketDto {
  id: number;
  type: TicketType;
  companyId: number;
  assigneeId: number;
  status: TicketStatus;
  category: TicketCategory;
}

@Controller('api/v1/tickets')
export class TicketsController {
  @Get()
  async findAll() {
    return await Ticket.findAll({ include: [Company, User] });
  }

  @Post()
  async create(@Body() newTicketDto: newTicketDto) {
    const { type, companyId } = newTicketDto;

    const category = TicketCategoryByType[type];
    let userRole = UserRoleByTicketType[type];

    // If the ticket type is registrationAddressChange, check for existing open tickets
    if (type === TicketType.registrationAddressChange) {
      const existingTicket = await Ticket.findOne({
        where: {
          companyId,
          type: TicketType.registrationAddressChange,
          status: TicketStatus.open,
        }
      });
      if (existingTicket) {
        throw new ConflictException(
          'There is already an open ticket for registration address change for this company.',
        );
      }
    }

    let assignees = await User.findAll({
      where: { companyId, role: userRole },
      order: [['createdAt', 'DESC']],
    });

    if (!assignees.length && type === TicketType.registrationAddressChange) {
      userRole = UserRole.director;
      assignees = await User.findAll({
        where: { companyId, role: userRole },
        order: [['createdAt', 'DESC']],
      });
    }

    if (!assignees.length)
      throw new ConflictException(
        `Cannot find user with role ${userRole} to create a ticket`,
      );

    if ([UserRole.corporateSecretary, UserRole.director].includes(userRole) && assignees.length > 1)
      throw new ConflictException(
        `Multiple users with role ${userRole}. Cannot create a ticket`,
      );

    const assignee = assignees[0];

    const ticket = await Ticket.create({
      companyId,
      assigneeId: assignee.id,
      category,
      type,
      status: TicketStatus.open,
    });

    // If the ticket type is strikeOff, we will close all other open tickets for the company
    if (type === TicketType.strikeOff) {
      await Ticket.update(
        { status: TicketStatus.resolved },
        {
          where: {
            companyId,
            status: TicketStatus.open,
            type: { [Op.ne]: TicketType.strikeOff },
          },
        },
      );
    }

    const ticketDto: TicketDto = {
      id: ticket.id,
      type: ticket.type,
      assigneeId: ticket.assigneeId,
      status: ticket.status,
      category: ticket.category,
      companyId: ticket.companyId,
    };

    return ticketDto;
  }
}

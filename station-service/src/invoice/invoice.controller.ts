import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { InvoiceStatus, InvoiceType, UserRole } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/index.js';
import { Roles } from '../auth/decorators/index.js';
import { InvoiceService } from './invoice.service.js';
import { InvoicePdfService } from './pdf/index.js';
import { CreateInvoiceDto, AddPaymentDto, CancelInvoiceDto } from './dto/index.js';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invoices')
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly invoicePdfService: InvoicePdfService,
  ) {}

  @Post()
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Créer une nouvelle facture' })
  @ApiResponse({ status: 201, description: 'Facture créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Station, client ou type de carburant non trouvé' })
  async create(@Body() dto: CreateInvoiceDto) {
    return this.invoiceService.create(dto);
  }

  @Post(':id/issue')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Émettre une facture (passer de DRAFT à ISSUED)' })
  @ApiParam({ name: 'id', description: 'UUID de la facture' })
  @ApiResponse({ status: 200, description: 'Facture émise avec succès' })
  @ApiResponse({ status: 400, description: 'Facture non en brouillon' })
  @ApiResponse({ status: 404, description: 'Facture non trouvée' })
  async issue(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoiceService.issue(id);
  }

  @Post(':id/payment')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Ajouter un paiement à une facture' })
  @ApiParam({ name: 'id', description: 'UUID de la facture' })
  @ApiResponse({ status: 200, description: 'Paiement ajouté avec succès' })
  @ApiResponse({ status: 400, description: 'Montant invalide ou facture déjà payée' })
  @ApiResponse({ status: 404, description: 'Facture ou moyen de paiement non trouvé' })
  async addPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddPaymentDto,
  ) {
    return this.invoiceService.addPayment(id, dto);
  }

  @Post(':id/cancel')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Annuler une facture' })
  @ApiParam({ name: 'id', description: 'UUID de la facture' })
  @ApiResponse({ status: 200, description: 'Facture annulée avec succès' })
  @ApiResponse({ status: 400, description: 'Impossible d\'annuler cette facture' })
  @ApiResponse({ status: 404, description: 'Facture non trouvée' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelInvoiceDto,
  ) {
    return this.invoiceService.cancel(id, dto);
  }

  @Get('by-station/:stationId')
  @ApiOperation({ summary: 'Récupérer les factures d\'une station' })
  @ApiParam({ name: 'stationId', description: 'UUID de la station' })
  @ApiQuery({ name: 'status', required: false, enum: InvoiceStatus })
  @ApiQuery({ name: 'invoiceType', required: false, enum: InvoiceType })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'from', required: false, description: 'Date de début (ISO)' })
  @ApiQuery({ name: 'to', required: false, description: 'Date de fin (ISO)' })
  @ApiResponse({ status: 200, description: 'Liste des factures' })
  async findByStation(
    @Param('stationId', ParseUUIDPipe) stationId: string,
    @Query('status') status?: InvoiceStatus,
    @Query('invoiceType') invoiceType?: InvoiceType,
    @Query('clientId') clientId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.invoiceService.findByStation(stationId, {
      status,
      invoiceType,
      clientId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('by-station/:stationId/unpaid')
  @ApiOperation({ summary: 'Factures impayées d\'une station' })
  @ApiParam({ name: 'stationId', description: 'UUID de la station' })
  @ApiResponse({ status: 200, description: 'Liste des factures impayées' })
  async getUnpaidInvoices(@Param('stationId', ParseUUIDPipe) stationId: string) {
    return this.invoiceService.getUnpaidInvoices(stationId);
  }

  @Get('by-station/:stationId/overdue')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Factures en retard de paiement' })
  @ApiParam({ name: 'stationId', description: 'UUID de la station' })
  @ApiResponse({ status: 200, description: 'Liste des factures en retard' })
  async getOverdueInvoices(@Param('stationId', ParseUUIDPipe) stationId: string) {
    return this.invoiceService.getOverdueInvoices(stationId);
  }

  @Get('by-client/:clientId')
  @ApiOperation({ summary: 'Factures d\'un client' })
  @ApiParam({ name: 'clientId', description: 'UUID du client' })
  @ApiResponse({ status: 200, description: 'Liste des factures du client' })
  async findByClient(@Param('clientId', ParseUUIDPipe) clientId: string) {
    return this.invoiceService.findByClient(clientId);
  }

  @Get(':id/pdf')
  @Roles(UserRole.GESTIONNAIRE, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Télécharger la facture en PDF' })
  @ApiParam({ name: 'id', description: 'UUID de la facture' })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'Fichier PDF de la facture',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Facture non trouvée' })
  async downloadPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const invoice = await this.invoiceService.findOne(id);
    const pdfBuffer = await this.invoicePdfService.generatePdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="facture-${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une facture par son ID' })
  @ApiParam({ name: 'id', description: 'UUID de la facture' })
  @ApiResponse({ status: 200, description: 'Facture trouvée avec ses relations' })
  @ApiResponse({ status: 404, description: 'Facture non trouvée' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoiceService.findOne(id);
  }
}

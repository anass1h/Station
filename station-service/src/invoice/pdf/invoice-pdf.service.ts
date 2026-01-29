import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../../prisma/index.js';

@Injectable()
export class InvoicePdfService {
  constructor(private readonly prisma: PrismaService) {}

  async generatePdf(invoiceId: string): Promise<Buffer> {
    // Récupérer la facture avec toutes les relations
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        station: true,
        client: true,
        lines: {
          include: {
            fuelType: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Facture avec l'ID ${invoiceId} non trouvée`);
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Facture ${invoice.invoiceNumber}`,
            Author: invoice.station.name,
          },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });
        doc.on('error', reject);

        // Générer le contenu du PDF
        this.generateHeader(doc, invoice);
        this.generateInvoiceInfo(doc, invoice);
        if (invoice.client) {
          this.generateClientInfo(doc, invoice);
        }
        this.generateLinesTable(doc, invoice);
        this.generateTotals(doc, invoice);
        this.generateFooter(doc, invoice);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private generateHeader(doc: PDFKit.PDFDocument, invoice: any): void {
    const station = invoice.station;

    // Logo placeholder (rectangle gris)
    doc
      .rect(50, 45, 80, 60)
      .stroke()
      .fontSize(8)
      .text('LOGO', 75, 70, { width: 30, align: 'center' });

    // Infos station
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(station.name, 150, 50, { width: 250 });

    doc
      .fontSize(9)
      .font('Helvetica')
      .text(station.address, 150, 70)
      .text(station.city, 150, 82);

    if (station.phone) {
      doc.text(`Tél: ${station.phone}`, 150, 94);
    }
    if (station.email) {
      doc.text(`Email: ${station.email}`, 150, 106);
    }

    // Identifiants fiscaux (à droite)
    let fiscalY = 50;
    doc.fontSize(8).font('Helvetica');

    if (station.ice) {
      doc.text(`ICE: ${station.ice}`, 400, fiscalY, { width: 150, align: 'right' });
      fiscalY += 12;
    }
    if (station.taxId) {
      doc.text(`IF: ${station.taxId}`, 400, fiscalY, { width: 150, align: 'right' });
      fiscalY += 12;
    }
    if (station.rc) {
      doc.text(`RC: ${station.rc}`, 400, fiscalY, { width: 150, align: 'right' });
      fiscalY += 12;
    }
    if (station.patente) {
      doc.text(`Patente: ${station.patente}`, 400, fiscalY, { width: 150, align: 'right' });
    }

    // Ligne de séparation
    doc
      .moveTo(50, 130)
      .lineTo(550, 130)
      .stroke();
  }

  private generateInvoiceInfo(doc: PDFKit.PDFDocument, invoice: any): void {
    // Titre FACTURE
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('FACTURE', 50, 150, { align: 'center' });

    // Infos facture dans un cadre
    const boxTop = 185;
    doc
      .rect(350, boxTop, 200, 70)
      .stroke();

    doc.fontSize(10).font('Helvetica');
    doc.text(`N° : ${invoice.invoiceNumber}`, 360, boxTop + 10);

    if (invoice.issuedAt) {
      const issuedDate = this.formatDate(invoice.issuedAt);
      doc.text(`Date : ${issuedDate}`, 360, boxTop + 25);
    }

    if (invoice.dueDate) {
      const dueDate = this.formatDate(invoice.dueDate);
      doc.text(`Échéance : ${dueDate}`, 360, boxTop + 40);
    }

    doc
      .font('Helvetica-Bold')
      .text(`Statut : ${this.translateStatus(invoice.status)}`, 360, boxTop + 55);
  }

  private generateClientInfo(doc: PDFKit.PDFDocument, invoice: any): void {
    const client = invoice.client;
    if (!client) return;

    const boxTop = 185;
    doc
      .rect(50, boxTop, 250, 70)
      .stroke();

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('CLIENT', 60, boxTop + 10);

    doc.font('Helvetica').fontSize(9);

    let y = boxTop + 25;
    if (client.companyName) {
      doc.font('Helvetica-Bold').text(client.companyName, 60, y);
      doc.font('Helvetica');
      y += 12;
    }
    if (client.contactName) {
      doc.text(client.contactName, 60, y);
      y += 10;
    }
    if (client.address) {
      doc.text(client.address, 60, y);
      y += 10;
    }

    // Identifiants fiscaux client (colonne droite du cadre)
    let fiscalY = boxTop + 25;
    if (client.ice) {
      doc.text(`ICE: ${client.ice}`, 180, fiscalY);
      fiscalY += 10;
    }
    if (client.taxId) {
      doc.text(`IF: ${client.taxId}`, 180, fiscalY);
      fiscalY += 10;
    }
    if (client.rc) {
      doc.text(`RC: ${client.rc}`, 180, fiscalY);
    }
  }

  private generateLinesTable(doc: PDFKit.PDFDocument, invoice: any): void {
    const tableTop = 280;
    const tableLeft = 50;

    // En-têtes de colonnes
    const columns = {
      description: { x: tableLeft, width: 180 },
      quantity: { x: tableLeft + 180, width: 60 },
      unitPrice: { x: tableLeft + 240, width: 80 },
      vatRate: { x: tableLeft + 320, width: 50 },
      total: { x: tableLeft + 370, width: 130 },
    };

    // En-tête du tableau
    doc
      .rect(tableLeft, tableTop, 500, 25)
      .fill('#f0f0f0');

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Description', columns.description.x + 5, tableTop + 8)
      .text('Qté (L)', columns.quantity.x + 5, tableTop + 8)
      .text('PU HT (MAD)', columns.unitPrice.x + 5, tableTop + 8)
      .text('TVA', columns.vatRate.x + 5, tableTop + 8)
      .text('Total TTC (MAD)', columns.total.x + 5, tableTop + 8);

    // Lignes de facture
    let y = tableTop + 30;
    doc.font('Helvetica').fontSize(9);

    for (const line of invoice.lines) {
      // Ligne de séparation
      doc
        .moveTo(tableLeft, y - 5)
        .lineTo(tableLeft + 500, y - 5)
        .stroke('#e0e0e0');

      const description = line.description || line.fuelType.name;
      const quantity = Number(line.quantity).toFixed(2);
      const unitPriceHT = Number(line.unitPriceHT).toFixed(2);
      const vatRate = `${Number(line.vatRate).toFixed(0)}%`;
      const totalTTC = Number(line.totalTTC).toFixed(2);

      doc
        .text(description, columns.description.x + 5, y, { width: columns.description.width - 10 })
        .text(quantity, columns.quantity.x + 5, y, { width: columns.quantity.width - 10, align: 'right' })
        .text(unitPriceHT, columns.unitPrice.x + 5, y, { width: columns.unitPrice.width - 10, align: 'right' })
        .text(vatRate, columns.vatRate.x + 5, y, { width: columns.vatRate.width - 10, align: 'center' })
        .text(totalTTC, columns.total.x + 5, y, { width: columns.total.width - 10, align: 'right' });

      y += 20;
    }

    // Ligne de fermeture du tableau
    doc
      .moveTo(tableLeft, y)
      .lineTo(tableLeft + 500, y)
      .stroke();

    // Stocker la position Y pour les totaux
    (doc as any)._tableEndY = y;
  }

  private generateTotals(doc: PDFKit.PDFDocument, invoice: any): void {
    const tableEndY = (doc as any)._tableEndY || 400;
    const totalsTop = tableEndY + 20;
    const totalsLeft = 350;

    // Cadre des totaux
    doc
      .rect(totalsLeft, totalsTop, 200, 80)
      .stroke();

    doc.fontSize(10).font('Helvetica');

    const amountHT = Number(invoice.amountHT).toFixed(2);
    const vatAmount = Number(invoice.vatAmount).toFixed(2);
    const vatRate = Number(invoice.vatRate).toFixed(0);
    const amountTTC = Number(invoice.amountTTC).toFixed(2);

    // Total HT
    doc
      .text('Total HT:', totalsLeft + 10, totalsTop + 10)
      .text(`${amountHT} MAD`, totalsLeft + 10, totalsTop + 10, { width: 180, align: 'right' });

    // TVA
    doc
      .text(`TVA (${vatRate}%):`, totalsLeft + 10, totalsTop + 30)
      .text(`${vatAmount} MAD`, totalsLeft + 10, totalsTop + 30, { width: 180, align: 'right' });

    // Ligne de séparation
    doc
      .moveTo(totalsLeft + 10, totalsTop + 50)
      .lineTo(totalsLeft + 190, totalsTop + 50)
      .stroke();

    // Total TTC
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('Total TTC:', totalsLeft + 10, totalsTop + 58)
      .text(`${amountTTC} MAD`, totalsLeft + 10, totalsTop + 58, { width: 180, align: 'right' });

    // Montant en lettres (optionnel)
    doc
      .font('Helvetica')
      .fontSize(9)
      .text(
        `Arrêté la présente facture à la somme de ${amountTTC} MAD`,
        50,
        totalsTop + 100,
        { width: 500 },
      );
  }

  private generateFooter(doc: PDFKit.PDFDocument, _invoice: any): void {
    const pageHeight = doc.page.height;
    const footerTop = pageHeight - 100;

    // Ligne de séparation
    doc
      .moveTo(50, footerTop)
      .lineTo(550, footerTop)
      .stroke();

    // Mentions légales
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#666666')
      .text(
        'En cas de retard de paiement, une pénalité de 1.5% par mois sera appliquée.',
        50,
        footerTop + 10,
        { width: 500, align: 'center' },
      )
      .text(
        'Pas d\'escompte pour paiement anticipé.',
        50,
        footerTop + 22,
        { width: 500, align: 'center' },
      );

    // Message de remerciement
    doc
      .fontSize(10)
      .fillColor('#000000')
      .font('Helvetica-Oblique')
      .text(
        'Merci pour votre confiance !',
        50,
        footerTop + 45,
        { width: 500, align: 'center' },
      );

    // Numéro de page
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#666666')
      .text(
        `Page 1/1 - Facture générée le ${this.formatDate(new Date())}`,
        50,
        footerTop + 70,
        { width: 500, align: 'center' },
      );
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private translateStatus(status: string): string {
    const statusMap: Record<string, string> = {
      DRAFT: 'Brouillon',
      ISSUED: 'Émise',
      PAID: 'Payée',
      PARTIALLY_PAID: 'Partiellement payée',
      CANCELLED: 'Annulée',
    };
    return statusMap[status] || status;
  }
}

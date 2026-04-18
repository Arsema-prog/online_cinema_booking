
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { env } from '../env';
import { getAccessTokenGetter } from '../httpClient';

export interface TicketDetails {
  moviePoster: string | undefined;
  id: string;
  movieTitle: string;
  cinemaName: string;
  screenNumber: string;
  showDate: string;
  showTime: string;
  seats: string[];
  totalAmount: number;
  bookingReference: string;
  qrCodeData: string;
  snacks?: string;
  snacksTotal?: number;
}

interface SupportTicketRecord {
  id: string;
  status?: string;
}

const resolveTicketValidationUrl = async (bookingId: string): Promise<string> => {
  const token = getAccessTokenGetter()();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  try {
    const payloadRes = await fetch(
      `${env.apiGatewayUrl}/api/v1/support/bookings/uuid/${encodeURIComponent(bookingId)}/tickets/primary-qr-payload`,
      { headers: authHeaders }
    );
    if (payloadRes.ok) {
      const body = await payloadRes.json() as { payload?: string };
      if (body?.payload) {
        return body.payload;
      }
    }
  } catch (error) {
    console.warn('Structured QR payload endpoint failed; trying ticket list.', error);
  }

  try {
    const response = await fetch(`${env.apiGatewayUrl}/api/v1/support/bookings/uuid/${encodeURIComponent(bookingId)}/tickets`, {
      headers: authHeaders
    });
    if (!response.ok) {
      throw new Error('Failed to fetch support ticket');
    }

    const tickets = await response.json() as SupportTicketRecord[];
    const firstTicket = Array.isArray(tickets) ? tickets[0] : null;

    if (firstTicket?.id) {
      return `${env.backOfficeUrl}/validate-ticket?ticketId=${encodeURIComponent(firstTicket.id)}`;
    }
  } catch (error) {
    console.warn('Falling back to booking id for QR payload because support ticket lookup failed.', error);
  }

  return bookingId;
};

export const ticketGeneratorService = {
  // Generate PDF ticket
  async generateTicket(booking: any): Promise<Blob> {
    const doc = new jsPDF();
    const qrPayload = await resolveTicketValidationUrl(booking.id);
    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload);
    
    // Real world ticket shape parameters
    const startX = 20;
    const startY = 30;
    const width = 170;
    const height = 90;
    const cornerRadius = 5;
    const cutoutRadius = 6;
    const stubWidth = 50;
    const dividerX = startX + width - stubWidth;
    
    // Draw outer boundary with rounded corners and slight background
    doc.setFillColor(248, 248, 252);
    doc.setDrawColor(139, 92, 246); // purple border
    doc.setLineWidth(1);
    doc.roundedRect(startX, startY, width, height, cornerRadius, cornerRadius, 'FD');
    
    // Draw dashed vertical line for the tear-off stub
    doc.setLineDashPattern([2, 2], 0);
    doc.line(dividerX, startY + cornerRadius, dividerX, startY + height - cornerRadius);
    doc.setLineDashPattern([], 0); // Restore solid line
    
    // Draw top and bottom cutouts (half-circles) on the divider line
    doc.setFillColor(255, 255, 255); // Background color (assume white page)
    doc.setDrawColor(139, 92, 246);
    doc.circle(dividerX, startY, cutoutRadius, 'FD');
    doc.circle(dividerX, startY + height, cutoutRadius, 'FD');
    
    // Draw a thick colored band on the left margin for styling
    doc.setFillColor(139, 92, 246);
    doc.setDrawColor(139, 92, 246);
    // Overlap slightly to fit within the rounded rect or just draw a rect and mask
    doc.roundedRect(startX, startY, 15, height, cornerRadius, cornerRadius, 'F');
    // Hide the right side rounding of the banner to make it flush
    doc.rect(startX + 10, startY, 5, height, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    // Draw vertical text
    doc.text('A D M I T  O N E', startX + 10, startY + 75, { angle: 90 });
    
    // --- Left side (Main Details) ---
    const textStartX = startX + 22;
    
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    const displayTitle = booking.movieTitle || 'Movie';
    const splitTitle = doc.splitTextToSize(displayTitle, dividerX - textStartX - 5);
    doc.text(splitTitle, textStartX, startY + 15);
    
    let currentY = startY + 20 + (splitTitle.length * 8);
    
    // Tabular representation
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    
    // Row 1 Headers
    doc.text('CINEMA', textStartX, currentY);
    doc.text('SCREEN', textStartX + 45, currentY);
    doc.text('DATE', textStartX + 65, currentY);
    
    currentY += 5;
    // Row 1 Data
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(booking.cinemaName || 'Cinema', textStartX, currentY);
    doc.text((booking.screenNumber || 'Screen').toString(), textStartX + 45, currentY);
    const showDate = new Date(booking.showTime);
    doc.text(showDate.toLocaleDateString(), textStartX + 65, currentY);
    
    currentY += 10;
    // Row 2 Headers
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('TIME', textStartX, currentY);
    doc.text('AMOUNT', textStartX + 45, currentY);
    
    currentY += 5;
    // Row 2 Data
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(showDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), textStartX, currentY);
    doc.text(`$${Number(booking.totalAmount).toFixed(2)}`, textStartX + 45, currentY);
    
    currentY += 10;
    // Row 3 Headers
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('SEATS', textStartX, currentY);
    if (booking.snacks) {
      doc.text('SNACKS', textStartX + 45, currentY);
    }
    currentY += 5;
    // Row 3 Data
    doc.setTextColor(139, 92, 246);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const seatsList = Array.isArray(booking.seats) ? booking.seats.join(', ') : booking.seats;
    const wrappedSeats = doc.splitTextToSize(seatsList || 'N/A', 40);
    doc.text(wrappedSeats, textStartX, currentY);
    
    if (booking.snacks) {
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      let snacksText = booking.snacks;
      try {
        if (snacksText.startsWith('{')) {
          const parsed = JSON.parse(snacksText);
          snacksText = Object.entries(parsed)
            .map(([k, v]: [string, any]) => `${v.quantity}x ${k.replace(/([A-Z])/g, ' $1').trim()}`)
            .join(', ');
        }
      } catch (e) {}
      const snacksWithTotal = booking.snacksTotal
        ? `${snacksText} ($${Number(booking.snacksTotal).toFixed(2)})`
        : snacksText;
      const wrappedSnacks = doc.splitTextToSize(snacksWithTotal, dividerX - (textStartX + 45) - 5);
      doc.text(wrappedSnacks, textStartX + 45, currentY);
    }
    
    // Footer Booking ID
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text(`ID: ${booking.id}`, textStartX, startY + height - 5);
    
    // --- Right side (Stub) ---
    const stubTextX = dividerX + 10;
    
    doc.addImage(qrCodeDataUrl, 'PNG', dividerX + (stubWidth - 30)/2, startY + 10, 30, 30);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('ADMIT ONE', stubTextX, startY + 50);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('SEATS:', stubTextX, startY + 65);
    doc.setTextColor(139, 92, 246);
    doc.setFont('helvetica', 'bold');
    const stubSeats = doc.splitTextToSize(seatsList || 'N/A', stubWidth - 15);
    doc.text(stubSeats, stubTextX, startY + 70);
    
    return doc.output('blob');
  },

  async getQrCodeUrl(data: string): Promise<string> {
    const qrPayload = await resolveTicketValidationUrl(data);
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrPayload)}`;
  },
 
  async getTicketDetails(bookingId: string): Promise<TicketDetails> {
    try {
      const bookingBase = `${env.apiGatewayUrl}/api/v1/booking/bookings`;
      // Fetch booking details from the API
      const response = await fetch(`${bookingBase}/${bookingId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch booking details');
      }
      const booking = await response.json();
      
      // Fetch seat details for this booking
      const seatsResponse = await fetch(`${bookingBase}/${bookingId}/seats`);
      let seats: string[] = [];
      
      if (seatsResponse.ok) {
        const seatsData = await seatsResponse.json();
        seats = seatsData.map((seat: any) => seat.seatNumber || seat);
      } else {
        // Fallback: generate seat numbers from booking data
        seats = booking.seats || [`Seat ${booking.seatCount || 1}`];
      }
      const showDateObj = new Date(booking.showTime);
      
      return {
        moviePoster: booking.moviePoster || undefined,
        id: booking.id,
        movieTitle: booking.movieTitle || 'Movie',
        cinemaName: booking.branchName || 'Cinema',
        screenNumber: booking.screenName || 'Screen',
         
  showDate: showDateObj.toLocaleDateString(),
  showTime: showDateObj.toLocaleTimeString(),

  seats: seats,

  totalAmount: booking.totalAmount || 0,
  bookingReference: booking.reference || booking.id,

  qrCodeData: booking.id,
  snacks: booking.snackDetails
 , snacksTotal: booking.snacksTotal
      };
    } catch (error) {
      console.error('Failed to get ticket details:', error);
      // Return mock data for development
      return {
        moviePoster: undefined,
        id: bookingId,
        movieTitle: 'Sample Movie',
        cinemaName: 'Grand Cinema',
        screenNumber: 'Screen 1',
        showDate: new Date().toISOString(),
        showTime: new Date().toISOString(),
        seats: ['A1'],
        totalAmount: 15.99,
        bookingReference: bookingId,
        qrCodeData: bookingId,
        snacks: undefined
      };
    }
  }
};

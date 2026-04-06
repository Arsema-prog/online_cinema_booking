import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { QrCode, CheckCircle, XCircle, Clock, Film, MapPin, Calendar, User, Ticket as TicketIcon } from 'lucide-react';
import { getTicketDetails, validateTicket, type Ticket } from '@/api/tickets';
import { useToast } from '@/hooks/use-toast';

const TicketsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedTicket, setScannedTicket] = useState<Ticket | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<'success' | 'error' | null>(null);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Handle ticketId from URL parameters (for external QR scans)
  const loadTicketFromUrl = useCallback(async (ticketId: string) => {
    setIsLoadingTicket(true);
    try {
      const ticket = await getTicketDetails(ticketId);
      setScannedTicket(ticket);
      // Clear the URL parameter after loading
      setSearchParams({});
    } catch (error) {
      console.error('Error loading ticket from URL:', error);
      toast({
        title: 'Ticket Not Found',
        description: 'The ticket ID from the QR code could not be found.',
        variant: 'destructive',
      });
      setSearchParams({});
    } finally {
      setIsLoadingTicket(false);
    }
  }, [setSearchParams, toast]);

  useEffect(() => {
    const ticketId = searchParams.get('ticketId');
    if (ticketId && !scannedTicket && !isLoadingTicket) {
      loadTicketFromUrl(ticketId);
    }
  }, [searchParams, scannedTicket, isLoadingTicket, loadTicketFromUrl]);

  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [scanner]);

  const startScanning = () => {
    if (!scannerRef.current) return;

    const html5QrcodeScanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    html5QrcodeScanner.render(
      (decodedText) => {
        onScanSuccess(decodedText);
      },
      () => {
        // Ignore scan errors, they're normal
      }
    );

    setScanner(html5QrcodeScanner);
    setIsScanning(true);
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.clear().catch(console.error);
      setScanner(null);
    }
    setIsScanning(false);
  };

  const onScanSuccess = async (decodedText: string) => {
    try {
      let ticketId = decodedText.trim();

      // Check if the QR code contains a validation URL
      if (ticketId.startsWith('/validate-ticket?ticketId=')) {
        const url = new URL(ticketId, window.location.origin);
        ticketId = url.searchParams.get('ticketId') || '';
      }

      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ticketId)) {
        toast({
          title: 'Invalid QR Code',
          description: 'The scanned QR code does not contain a valid ticket ID.',
          variant: 'destructive',
        });
        return;
      }

      stopScanning();

      // Fetch ticket details
      const ticket = await getTicketDetails(ticketId);
      setScannedTicket(ticket);

    } catch (error) {
      console.error('Error scanning ticket:', error);
      toast({
        title: 'Scan Error',
        description: 'Failed to process the scanned ticket. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleValidateTicket = async () => {
    if (!scannedTicket) return;

    setIsValidating(true);
    try {
      const validatedTicket = await validateTicket(scannedTicket.id);
      setScannedTicket(validatedTicket);
      setValidationResult('success');

      toast({
        title: 'Ticket Validated',
        description: 'The ticket has been successfully validated and marked as used.',
      });
    } catch (error) {
      console.error('Error validating ticket:', error);
      setValidationResult('error');

      toast({
        title: 'Validation Failed',
        description: 'Failed to validate the ticket. It may already be used or invalid.',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const resetScanner = () => {
    setScannedTicket(null);
    setValidationResult(null);
    setIsScanning(false);
    if (scanner) {
      scanner.clear().catch(console.error);
      setScanner(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'USED':
        return <Badge variant="secondary">Used</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ticket Validation</h1>
          <p className="text-muted-foreground">
            Scan QR codes to validate tickets and prevent reuse
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* QR Scanner Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code Scanner
            </CardTitle>
            <CardDescription>
              Point your camera at a ticket QR code to scan and validate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isScanning ? (
              <div className="text-center py-8">
                <QrCode className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <Button onClick={startScanning} size="lg">
                  Start Scanning
                </Button>
              </div>
            ) : (
              <div>
                <div id="qr-reader" ref={scannerRef} className="w-full"></div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={stopScanning} variant="outline" className="flex-1">
                    Stop Scanning
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ticket Details Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TicketIcon className="h-5 w-5" />
              Ticket Details
            </CardTitle>
            <CardDescription>
              {scannedTicket ? 'Review ticket information before validation' : 'Scan a ticket to view details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTicket ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading ticket details...</p>
              </div>
            ) : scannedTicket ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  {getStatusBadge(scannedTicket.status)}
                </div>

                <Separator />

                <div className="grid gap-3">
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-medium">Movie:</span> {scannedTicket.movieTitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-medium">Location:</span> {scannedTicket.branchName} - {scannedTicket.screenName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-medium">Show Time:</span> {new Date(scannedTicket.showTime).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-medium">Seat:</span> {scannedTicket.seatNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-medium">Price:</span> ${scannedTicket.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Separator />

                {validationResult && (
                  <Alert className={validationResult === 'success' ? 'border-green-500' : 'border-red-500'}>
                    <div className="flex items-center gap-2">
                      {validationResult === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <AlertDescription>
                        {validationResult === 'success'
                          ? 'Ticket validated successfully!'
                          : 'Ticket validation failed. It may already be used.'}
                      </AlertDescription>
                    </div>
                  </Alert>
                )}

                <div className="flex gap-2">
                  {scannedTicket.status === 'ACTIVE' && (
                    <Button
                      onClick={handleValidateTicket}
                      disabled={isValidating}
                      className="flex-1"
                    >
                      {isValidating ? 'Validating...' : 'Validate Ticket'}
                    </Button>
                  )}
                  <Button onClick={resetScanner} variant="outline">
                    Scan Another
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TicketIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No ticket scanned yet</p>
                <p className="text-sm">Use the scanner to read a QR code</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TicketsPage;
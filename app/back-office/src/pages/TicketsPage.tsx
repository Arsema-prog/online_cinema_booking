// import React, { useState, useRef, useEffect, useCallback } from 'react';
// import { useSearchParams } from 'react-router-dom';
// import { Html5QrcodeScanner } from 'html5-qrcode';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Separator } from '@/components/ui/separator';
// import { QrCode, CheckCircle, XCircle, Clock, Film, MapPin, Calendar, User, Ticket as TicketIcon } from 'lucide-react';
// import { getTicketDetails, validateTicket, type Ticket } from '@/api/tickets';
// import { useToast } from '@/hooks/use-toast';

// const TicketsPage: React.FC = () => {
//   const [searchParams, setSearchParams] = useSearchParams();
//   const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
//   const [isScanning, setIsScanning] = useState(false);
//   const [scannedTicket, setScannedTicket] = useState<Ticket | null>(null);
//   const [isValidating, setIsValidating] = useState(false);
//   const [validationResult, setValidationResult] = useState<'success' | 'error' | null>(null);
//   const [isLoadingTicket, setIsLoadingTicket] = useState(false);
//   const scannerRef = useRef<HTMLDivElement>(null);
//   const { toast } = useToast();

//   // Handle ticketId from URL parameters (for external QR scans)
//   const loadTicketFromUrl = useCallback(async (ticketId: string) => {
//     setIsLoadingTicket(true);
//     try {
//       const ticket = await getTicketDetails(ticketId);
//       setScannedTicket(ticket);
//       // Clear the URL parameter after loading
//       setSearchParams({});
//     } catch (error) {
//       console.error('Error loading ticket from URL:', error);
//       toast({
//         title: 'Ticket Not Found',
//         description: 'The ticket ID from the QR code could not be found.',
//         variant: 'destructive',
//       });
//       setSearchParams({});
//     } finally {
//       setIsLoadingTicket(false);
//     }
//   }, [setSearchParams, toast]);

//   useEffect(() => {
//     const ticketId = searchParams.get('ticketId');
//     if (ticketId && !scannedTicket && !isLoadingTicket) {
//       loadTicketFromUrl(ticketId);
//     }
//   }, [searchParams, scannedTicket, isLoadingTicket, loadTicketFromUrl]);

//   useEffect(() => {
//     return () => {
//       if (scanner) {
//         scanner.clear().catch(console.error);
//       }
//     };
//   }, [scanner]);

//   const startScanning = () => {
//     if (!scannerRef.current) return;

//     const html5QrcodeScanner = new Html5QrcodeScanner(
//       'qr-reader',
//       {
//         fps: 10,
//         qrbox: { width: 250, height: 250 },
//         aspectRatio: 1.0,
//       },
//       false
//     );

//     html5QrcodeScanner.render(
//       (decodedText) => {
//         onScanSuccess(decodedText);
//       },
//       () => {
//         // Ignore scan errors, they're normal
//       }
//     );

//     setScanner(html5QrcodeScanner);
//     setIsScanning(true);
//   };

//   const stopScanning = () => {
//     if (scanner) {
//       scanner.clear().catch(console.error);
//       setScanner(null);
//     }
//     setIsScanning(false);
//   };

//   const onScanSuccess = async (decodedText: string) => {
//     try {
//       let ticketId = decodedText.trim();

//       // Check if the QR code contains a validation URL
//       if (ticketId.startsWith('/validate-ticket?ticketId=')) {
//         const url = new URL(ticketId, window.location.origin);
//         ticketId = url.searchParams.get('ticketId') || '';
//       }

//       // Validate UUID format
//       if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ticketId)) {
//         toast({
//           title: 'Invalid QR Code',
//           description: 'The scanned QR code does not contain a valid ticket ID.',
//           variant: 'destructive',
//         });
//         return;
//       }

//       stopScanning();

//       // Fetch ticket details
//       const ticket = await getTicketDetails(ticketId);
//       setScannedTicket(ticket);

//     } catch (error) {
//       console.error('Error scanning ticket:', error);
//       toast({
//         title: 'Scan Error',
//         description: 'Failed to process the scanned ticket. Please try again.',
//         variant: 'destructive',
//       });
//     }
//   };

//   const handleValidateTicket = async () => {
//     if (!scannedTicket) return;

//     setIsValidating(true);
//     try {
//       const validatedTicket = await validateTicket(scannedTicket.id);
//       setScannedTicket(validatedTicket);
//       setValidationResult('success');

//       toast({
//         title: 'Ticket Validated',
//         description: 'The ticket has been successfully validated and marked as used.',
//       });
//     } catch (error) {
//       console.error('Error validating ticket:', error);
//       setValidationResult('error');

//       toast({
//         title: 'Validation Failed',
//         description: 'Failed to validate the ticket. It may already be used or invalid.',
//         variant: 'destructive',
//       });
//     } finally {
//       setIsValidating(false);
//     }
//   };

//   const resetScanner = () => {
//     setScannedTicket(null);
//     setValidationResult(null);
//     setIsScanning(false);
//     if (scanner) {
//       scanner.clear().catch(console.error);
//       setScanner(null);
//     }
//   };

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case 'ACTIVE':
//         return <Badge variant="default" className="bg-green-500">Active</Badge>;
//       case 'USED':
//         return <Badge variant="secondary">Used</Badge>;
//       case 'CANCELLED':
//         return <Badge variant="destructive">Cancelled</Badge>;
//       default:
//         return <Badge variant="outline">Unknown</Badge>;
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">Ticket Validation</h1>
//           <p className="text-muted-foreground">
//             Scan QR codes to validate tickets and prevent reuse
//           </p>
//         </div>
//       </div>

//       <div className="grid gap-6 md:grid-cols-2">
//         {/* QR Scanner Section */}
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <QrCode className="h-5 w-5" />
//               QR Code Scanner
//             </CardTitle>
//             <CardDescription>
//               Point your camera at a ticket QR code to scan and validate
//             </CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             {!isScanning ? (
//               <div className="text-center py-8">
//                 <QrCode className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
//                 <Button onClick={startScanning} size="lg">
//                   Start Scanning
//                 </Button>
//               </div>
//             ) : (
//               <div>
//                 <div id="qr-reader" ref={scannerRef} className="w-full"></div>
//                 <div className="flex gap-2 mt-4">
//                   <Button onClick={stopScanning} variant="outline" className="flex-1">
//                     Stop Scanning
//                   </Button>
//                 </div>
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         {/* Ticket Details Section */}
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <TicketIcon className="h-5 w-5" />
//               Ticket Details
//             </CardTitle>
//             <CardDescription>
//               {scannedTicket ? 'Review ticket information before validation' : 'Scan a ticket to view details'}
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             {isLoadingTicket ? (
//               <div className="text-center py-8">
//                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
//                 <p className="text-muted-foreground">Loading ticket details...</p>
//               </div>
//             ) : scannedTicket ? (
//               <div className="space-y-4">
//                 <div className="flex items-center justify-between">
//                   <span className="font-medium">Status:</span>
//                   {getStatusBadge(scannedTicket.status)}
//                 </div>

//                 <Separator />

//                 <div className="grid gap-3">
//                   <div className="flex items-center gap-2">
//                     <Film className="h-4 w-4 text-muted-foreground" />
//                     <span className="text-sm">
//                       <span className="font-medium">Movie:</span> {scannedTicket.movieTitle}
//                     </span>
//                   </div>

//                   <div className="flex items-center gap-2">
//                     <MapPin className="h-4 w-4 text-muted-foreground" />
//                     <span className="text-sm">
//                       <span className="font-medium">Location:</span> {scannedTicket.branchName} - {scannedTicket.screenName}
//                     </span>
//                   </div>

//                   <div className="flex items-center gap-2">
//                     <Calendar className="h-4 w-4 text-muted-foreground" />
//                     <span className="text-sm">
//                       <span className="font-medium">Show Time:</span> {new Date(scannedTicket.showTime).toLocaleString()}
//                     </span>
//                   </div>

//                   <div className="flex items-center gap-2">
//                     <User className="h-4 w-4 text-muted-foreground" />
//                     <span className="text-sm">
//                       <span className="font-medium">Seat:</span> {scannedTicket.seatNumber}
//                     </span>
//                   </div>

//                   <div className="flex items-center gap-2">
//                     <Clock className="h-4 w-4 text-muted-foreground" />
//                     <span className="text-sm">
//                       <span className="font-medium">Price:</span> ${scannedTicket.price.toFixed(2)}
//                     </span>
//                   </div>
//                 </div>

//                 <Separator />

//                 {validationResult && (
//                   <Alert className={validationResult === 'success' ? 'border-green-500' : 'border-red-500'}>
//                     <div className="flex items-center gap-2">
//                       {validationResult === 'success' ? (
//                         <CheckCircle className="h-4 w-4 text-green-500" />
//                       ) : (
//                         <XCircle className="h-4 w-4 text-red-500" />
//                       )}
//                       <AlertDescription>
//                         {validationResult === 'success'
//                           ? 'Ticket validated successfully!'
//                           : 'Ticket validation failed. It may already be used.'}
//                       </AlertDescription>
//                     </div>
//                   </Alert>
//                 )}

//                 <div className="flex gap-2">
//                   {scannedTicket.status === 'ACTIVE' && (
//                     <Button
//                       onClick={handleValidateTicket}
//                       disabled={isValidating}
//                       className="flex-1"
//                     >
//                       {isValidating ? 'Validating...' : 'Validate Ticket'}
//                     </Button>
//                   )}
//                   <Button onClick={resetScanner} variant="outline">
//                     Scan Another
//                   </Button>
//                 </div>
//               </div>
//             ) : (
//               <div className="text-center py-8 text-muted-foreground">
//                 <TicketIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
//                 <p>No ticket scanned yet</p>
//                 <p className="text-sm">Use the scanner to read a QR code</p>
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default TicketsPage;

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Upload, CheckCircle, XCircle, Clock, Film, MapPin, Calendar, User, Ticket as TicketIcon, Loader2, FileText, QrCode, Flag } from 'lucide-react';
import { getTicketDetails, validateTicket, validateTicketByQrValue, type Ticket } from '@/api/tickets';
import { useToast } from '@/hooks/use-toast';
import { extractQrValueFromFile } from '@/lib/ticketQr';

const TicketsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [scannedTicket, setScannedTicket] = useState<Ticket | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<'success' | 'error' | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handle ticketId from URL parameters (for external QR scans)
  const loadTicketFromUrl = useCallback(async (ticketId: string) => {
    setIsLoadingTicket(true);
    try {
      const ticket = await getTicketDetails(ticketId);
      setScannedTicket(ticket);
      setValidationResult(null);
      setValidationMessage(null);
      // Clear the URL parameter after loading
      setSearchParams({});
      
      toast({
        title: 'Ticket Loaded',
        description: `Ticket for ${ticket.movieTitle} - Seat ${ticket.seatNumber}`,
        variant: 'success',
      });

      // Staff flow: when arriving via QR validation link, auto-mark ACTIVE tickets as USED
      // so second scans immediately show the "already used" state.
      if (ticket.status === 'ACTIVE') {
        setIsValidating(true);
        try {
          const { ticket: validatedTicket, status, message } = await validateTicket(ticket.id);
          if (validatedTicket) {
            setScannedTicket(validatedTicket);
          }
          setValidationResult(status === 'SUCCESS' ? 'success' : 'error');
          setValidationMessage(message);
          toast({
            title: '✓ Ticket Validated Successfully',
            description: message,
            variant: status === 'SUCCESS' ? 'success' : 'error',
          });
        } catch (error) {
          console.error('Auto validation failed:', error);
          setValidationResult('error');
          setValidationMessage(error instanceof Error ? error.message : 'Failed to validate the ticket.');
          toast({
            title: 'Validation Failed',
            description:
              error instanceof Error ? error.message : 'Failed to validate the ticket.',
            variant: 'error',
          });
        } finally {
          setIsValidating(false);
        }
      }
    } catch (error) {
      console.error('Error loading ticket from URL:', error);
      toast({
        title: 'Ticket Not Found',
        description: 'The ticket ID from the QR code could not be found.',
        variant: 'error',
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isPDF = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    
    if (!isPDF && !isImage) {
      toast({
        title: 'Invalid File',
        description: 'Please upload a PDF ticket or an image file (PNG, JPG, JPEG)',
        variant: 'error',
      });
      return;
    }

    // Validate file size (max 10MB for PDF, 5MB for images)
    const maxSize = isPDF ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: `${isPDF ? 'PDF' : 'Image'} must be less than ${maxSize / (1024 * 1024)}MB`,
        variant: 'error',
      });
      return;
    }

    setSelectedFileName(file.name);
    setIsUploading(true);
    setIsScanning(true);
    setValidationMessage(null);

    console.log('TicketsPage: processing ticket file', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });

    try {
      const qrValue = await extractQrValueFromFile(file);
      console.log('TicketsPage: extracted qr value from file');

      const { ticket, status, message } = await validateTicketByQrValue(qrValue);
      if (ticket) {
        setScannedTicket(ticket);
      }
      setValidationResult(status === 'SUCCESS' ? 'success' : 'error');
      setValidationMessage(message);

      if (status === 'SUCCESS') {
        toast({
          title: 'Ticket Validated Successfully',
          description: message,
          variant: 'success',
        });
      } else if (status === 'FAILED') {
        toast({
          title: 'Ticket Already Used',
          description: message,
          variant: 'error',
        });
      } else {
        toast({
          title: 'Ticket Validation Error',
          description: message,
          variant: 'error',
        });
      }

      // Reset upload state but keep the ticket loaded
      resetUpload();
      
    } catch (error) {
      const responseData = typeof error === 'object' && error !== null ? (error as any)?.response?.data : undefined;

      console.error('Scan error:', {
        responseData,
        error,
      });

      const apiMessage =
        typeof error === 'object' && error !== null
          ? (error as any)?.response?.data?.error || (error as any)?.response?.data?.message
          : undefined;
      const diagnostics =
        typeof error === 'object' && error !== null
          ? (error as any)?.response?.data?.diagnostics
          : undefined;
      toast({
        title: 'Scan Failed',
        description:
          diagnostics && Array.isArray(diagnostics)
            ? `${apiMessage || 'Could not process the QR code from this file'} (${diagnostics.join(', ')})`
            : apiMessage || (error instanceof Error ? error.message : 'Could not process the QR code from this file'),
        variant: 'error',
      });
      setValidationResult('error');
      setValidationMessage(
        diagnostics && Array.isArray(diagnostics)
          ? `${apiMessage || 'Could not process the QR code from this file'} (${diagnostics.join(', ')})`
          : apiMessage || (error instanceof Error ? error.message : 'Could not process the QR code from this file')
      );
      resetUpload();
    }
  };

  const resetUpload = () => {
    setSelectedFileName('');
    setIsUploading(false);
    setIsScanning(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleValidateTicket = async () => {
    if (!scannedTicket) return;

    setIsValidating(true);
    setValidationMessage(null);
    try {
      const { ticket: validatedTicket, status, message } = await validateTicket(scannedTicket.id);
      if (validatedTicket) {
        setScannedTicket(validatedTicket);
      }
      setValidationResult(status === 'SUCCESS' ? 'success' : 'error');
      setValidationMessage(message);

      toast({
        title: '✓ Ticket Validated Successfully',
        description: message,
        variant: status === 'SUCCESS' ? 'success' : 'error',
      });
    } catch (error) {
      console.error('Error validating ticket:', error);
      setValidationResult('error');

      const apiMessage =
        typeof error === 'object' && error !== null
          ? (error as any)?.response?.data?.error || (error as any)?.response?.data?.message
          : undefined;
      setValidationMessage(apiMessage || (error instanceof Error ? error.message : 'Failed to validate the ticket. It may already be used or invalid.'));

      toast({
        title: 'Validation Failed',
        description: apiMessage || (error instanceof Error ? error.message : 'Failed to validate the ticket. It may already be used or invalid.'),
        variant: 'error',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const resetScanner = () => {
    setScannedTicket(null);
    setValidationResult(null);
    setValidationMessage(null);
    resetUpload();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-500 animate-pulse">✓ Active - Ready to Validate</Badge>;
      case 'USED':
        return <Badge variant="secondary" className="bg-gray-500">✗ Used - Already Validated</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">✗ Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ticket Validation System</h1>
          <p className="text-muted-foreground">
            Upload ticket PDF or QR code to validate and prevent duplicate usage
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Ticket File
            </CardTitle>
            <CardDescription>
              Upload a PDF ticket or a screenshot of the QR code for scanning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={resetUpload}>
                Upload Another Ticket
              </Button>
            </div>
            {!isUploading && !isScanning && !selectedFileName && (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">Click to upload ticket PDF or QR image</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG, JPEG (max 10MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}

            {(isUploading || isScanning) && (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
                <p className="text-muted-foreground font-medium">Scanning ticket file...</p>
                <p className="text-xs text-muted-foreground mt-2">Looking for QR code in the file</p>
              </div>
            )}

            {selectedFileName && !isUploading && !isScanning && (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-sm font-medium">{selectedFileName}</p>
                <p className="text-xs text-muted-foreground mt-1">File uploaded successfully</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ticket Details & Validation Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TicketIcon className="h-5 w-5" />
              Ticket Details & Validation
            </CardTitle>
            <CardDescription>
              {scannedTicket 
                ? 'Review ticket information and validate usage' 
                : 'Upload a ticket file to view details and validate'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTicket ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
                <p className="text-muted-foreground">Loading ticket details...</p>
              </div>
            ) : scannedTicket ? (
              <div className="space-y-4">
                {/* Status Banner */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Current Status:</span>
                  {getStatusBadge(scannedTicket.status)}
                </div>

                <Separator />

                {/* Ticket Information */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Ticket Information</h3>
                  
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Film className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        <span className="font-medium">Movie:</span> {scannedTicket.movieTitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        <span className="font-medium">Location:</span> {scannedTicket.branchName} - {scannedTicket.screenName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        <span className="font-medium">Show Time:</span> {new Date(scannedTicket.showTime).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <User className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        <span className="font-medium">Seat Number:</span> {scannedTicket.seatNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        <span className="font-medium">Price:</span> ${scannedTicket.price.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <TicketIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        <span className="font-medium">Ticket Number:</span> {scannedTicket.ticketNumber}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Validation Result Alert */}
                {validationResult && (
                  <Alert className={validationResult === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                    <div className="space-y-3">
                      {validationResult === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <AlertDescription className={validationResult === 'success' ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                        {validationResult === 'success'
                          ? '✓ Ticket has been successfully validated and marked as USED. This ticket cannot be used again.'
                          : '✗ Ticket validation failed. The ticket may already be used or invalid.'}
                      </AlertDescription>
                      {scannedTicket && (
                        <div className={validationResult === 'success' ? 'rounded-md border border-green-200 bg-white/70 p-3 text-sm text-green-800' : 'rounded-md border border-red-200 bg-white/70 p-3 text-sm text-red-800'}>
                          {validationMessage && <p className="mb-2 font-semibold">{validationMessage}</p>}
                          <p><span className="font-semibold">Movie:</span> {scannedTicket.movieTitle}</p>
                          <p><span className="font-semibold">Time:</span> {new Date(scannedTicket.showTime).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  {scannedTicket.status === 'ACTIVE' && (
                    <Button
                      onClick={handleValidateTicket}
                      disabled={isValidating}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      {isValidating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Validating...
                        </>
                      ) : (
                        <>
                          <Flag className="h-4 w-4 mr-2" />
                          Validate Ticket & Mark as Used
                        </>
                      )}
                    </Button>
                  )}
                  {scannedTicket.status === 'USED' && (
                    <Button
                      disabled
                      className="flex-1 bg-gray-400 cursor-not-allowed"
                      size="lg"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Ticket Already Used
                    </Button>
                  )}
                  <Button onClick={resetScanner} variant="outline" size="lg">
                    Upload New Ticket
                  </Button>
                </div>

                {/* Info message for already used tickets */}
                {scannedTicket.status === 'USED' && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    This ticket has already been validated and cannot be used again.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <QrCode className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No ticket loaded</p>
                <p className="text-sm mt-1">Upload a PDF ticket or QR image to start validation</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TicketsPage;

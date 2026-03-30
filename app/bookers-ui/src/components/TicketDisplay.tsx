// import React from 'react';
// import { TicketDetails, ticketGeneratorService } from '../services/ticketGeneratorService';
// import { CheckCircle, MapPin, Calendar, Clock, MonitorPlay, Ticket } from 'lucide-react';

// interface Props {
//   ticket: TicketDetails;
//   onDownload: () => void;
//   onClose: () => void;
// }

// export const TicketDisplay: React.FC<Props> = ({ ticket, onDownload, onClose }) => {
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
//       <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 my-8">
        
//         {/* Ticket Header */}
//         <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white text-center shadow-md relative overflow-hidden">
//           {/* Confetti Animation Layer */}
//           <div className="absolute inset-0 pointer-events-none">
//              {[...Array(50)].map((_, i) => (
//                <div 
//                  key={i} 
//                  className={`absolute w-3 h-3 ${['bg-red-400', 'bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-purple-400'][i % 5]}`}
//                  style={{
//                    top: '-10px',
//                    left: `${Math.random() * 100}%`,
//                    opacity: Math.random() + 0.2,
//                    transform: `rotate(${Math.random() * 360}deg)`,
//                    animation: `fall ${Math.random() * 3 + 2}s linear forwards`,
//                    animationDelay: `${Math.random() * 2}s`
//                  }}
//                />
//              ))}
//              <style>{`
//                @keyframes fall {
//                  to { transform: translateY(200px) rotate(720deg); opacity: 0; }
//                }
//              `}</style>
//           </div>
          
//           <div className="absolute top-4 right-4 cursor-pointer text-white/70 hover:text-white" onClick={onClose} style={{ zIndex: 10 }}>
//             ✕
//           </div>
//           <div className="flex justify-center mb-2 relative z-10">
//             <CheckCircle className="w-12 h-12 text-green-300" />
//           </div>
//           <h2 className="text-3xl font-bold mb-1 relative z-10">Payment Successful!</h2>
//           <p className="text-indigo-100 relative z-10">Your booking is confirmed.</p>
//         </div>

//         {/* Realistic Ticket Body */}
//         <div className="p-8 relative">
//           {/* Perforation effect left */}
//           <div className="absolute -left-4 top-1/2 w-8 h-8 bg-slate-900 rounded-full shadow-inner z-10"></div>
//           {/* Perforation effect right */}
//           <div className="absolute -right-4 top-1/2 w-8 h-8 bg-slate-900 rounded-full shadow-inner z-10"></div>
//           {/* Dashed line */}
//           <div className="absolute left-4 right-4 top-1/2 h-0 border-t-2 border-dashed border-slate-700/50"></div>

//           <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-6 relative overflow-hidden">
            
//             {/* Left Col: Poster */}
//             <div className="hidden md:block col-span-1 rounded-xl overflow-hidden shadow-lg border border-slate-700">
//               <img src={ticket.moviePoster} alt={ticket.movieTitle} className="w-full h-full object-cover" />
//             </div>

//             {/* Right Col: Details */}
//             <div className="col-span-1 md:col-span-2 flex flex-col justify-between">
//               <div>
//                 <div className="flex justify-between items-start mb-4">
//                   <div>
//                     <h3 className="text-2xl font-bold text-white leading-tight">{ticket.movieTitle}</h3>
//                     <p className="text-slate-400 font-medium flex items-center mt-1">
//                       <MapPin className="w-4 h-4 mr-1" /> {ticket.cinemaName}
//                     </p>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Ref No.</p>
//                     <p className="text-lg font-mono text-purple-400 font-bold">{ticket.bookingReference}</p>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4 mt-6">
//                   <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
//                     <p className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center"><Calendar className="w-3 h-3 mr-1"/> Date</p>
//                     <p className="font-semibold text-white">{ticket.showDate}</p>
//                   </div>
//                   <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
//                     <p className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center"><Clock className="w-3 h-3 mr-1"/> Time</p>
//                     <p className="font-semibold text-white">{ticket.showTime}</p>
//                   </div>
//                   <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
//                     <p className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center"><MonitorPlay className="w-3 h-3 mr-1"/> Screen</p>
//                     <p className="font-semibold text-white">{ticket.screenNumber}</p>
//                   </div>
//                   <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
//                     <p className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center"><Ticket className="w-3 h-3 mr-1"/> Seats ({ticket.seats.length})</p>
//                     <p className="font-semibold text-amber-400">{ticket.seats.join(', ')}</p>
//                   </div>
//                 </div>
//               </div>

//               {/* Lower Section with QR */}
//               <div className="mt-8 pt-6 border-t border-slate-700 flex justify-between items-end">
//                 <div>
//                   <p className="text-slate-400 text-sm">Total Paid</p>
//                   <p className="text-3xl font-bold text-white">${ticket.totalPrice.toFixed(2)}</p>
//                 </div>
//                 <div className="bg-white p-2 rounded-lg shadow-inner">
//                   <img src={ticketGeneratorService.getQrCodeUrl(ticket.qrCodeData)} alt="Ticket QR" className="w-20 h-20" />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Ticket Footer Actions */}
//         <div className="bg-slate-800 p-6 flex justify-between items-center border-t border-slate-700">
//           <p className="text-xs text-slate-500 max-w-sm">
//             Tickets are non-refundable. Please present this QR code at the cinema entrance. 
//             Enjoy the show!
//           </p>
//           <div className="flex gap-3">
//             <button 
//               onClick={onClose}
//               className="px-6 py-2 rounded-lg font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition"
//             >
//               Done
//             </button>
//             <button 
//               onClick={onDownload}
//               className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold shadow-lg shadow-purple-900/50 transition flex items-center gap-2"
//             >
//               ⬇️ Download PDF
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
import React from 'react';
import { TicketDetails, ticketGeneratorService } from '../services/ticketGeneratorService';
import { CheckCircle, MapPin } from 'lucide-react';

interface Props {
  ticket: TicketDetails;
  onDownload: () => void;
  onClose: () => void;
}

export const TicketDisplay: React.FC<Props> = ({ ticket, onDownload, onClose }) => {
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>("");

  React.useEffect(() => {
    let isMounted = true;
    ticketGeneratorService.getQrCodeUrl(ticket.qrCodeData).then(url => {
      if (isMounted) setQrCodeUrl(url);
    });
    return () => { isMounted = false; };
  }, [ticket.qrCodeData]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">

      {/* ✅ MAIN TICKET CONTAINER WITH SHAPE */}
      <div className="relative w-full max-w-2xl bg-slate-900 shadow-2xl overflow-hidden ticket-shape animate-in fade-in zoom-in duration-300 my-8">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white text-center relative">
          
          {/* Close */}
          <div 
            className="absolute top-4 right-4 cursor-pointer text-white/70 hover:text-white"
            onClick={onClose}
          >
            ✕
          </div>

          <CheckCircle className="w-12 h-12 mx-auto text-green-300 mb-2" />
          <h2 className="text-3xl font-bold">Payment Successful!</h2>
          <p className="text-indigo-100">Your booking is confirmed.</p>
        </div>

        {/* BODY */}
        <div className="p-8 relative">

          {/* Cut circles */}
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-black rounded-full z-20"></div>
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-black rounded-full z-20"></div>

          {/* Perforation */}
          <div className="absolute left-0 right-0 top-1/2 flex justify-center">
            <div className="w-[90%] border-t-2 border-dashed border-slate-600"></div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Poster */}
            <div className="hidden md:block rounded-xl overflow-hidden border border-slate-700">
              <img 
                src={ticket.moviePoster} 
                alt={ticket.movieTitle} 
                className="w-full h-full object-cover" 
              />
            </div>

            {/* DETAILS */}
            <div className="md:col-span-2 flex flex-col justify-between">

              {/* Top */}
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{ticket.movieTitle}</h3>
                    <p className="text-slate-400 flex items-center mt-1">
                      <MapPin className="w-4 h-4 mr-1" /> {ticket.cinemaName}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase font-bold">Ref No.</p>
                    <p className="text-lg font-mono text-purple-400 font-bold">
                      {ticket.bookingReference}
                    </p>
                  </div>
                </div>

                {/* ✅ TABLE */}
                {/* <div className="mt-6 overflow-hidden rounded-xl border border-slate-700">
                  <table className="w-full text-sm text-slate-300">
                    <tbody>
                      <tr className="border-b border-slate-700">
                        <td className="px-4 py-3 font-semibold">Date</td>
                        <td className="px-4 py-3">{ticket.showDate}</td>
                      </tr>
                      <tr className="border-b border-slate-700">
                        <td className="px-4 py-3 font-semibold">Time</td>
                        <td className="px-4 py-3">{ticket.showTime}</td>
                      </tr>
                      <tr className="border-b border-slate-700">
                        <td className="px-4 py-3 font-semibold">Screen</td>
                        <td className="px-4 py-3">{ticket.screenNumber}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold">Seats</td>
                        <td className="px-4 py-3 text-amber-400">
                          {ticket.seats.join(', ')} ({ticket.seats.length})
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div> */}
                <div className="mt-6 overflow-hidden rounded-xl border border-slate-700 bg-slate-900/50">
  <table className="w-full text-sm">
    <tbody>
      {[
        ['Date', ticket.showDate],
        ['Time', ticket.showTime],
        ['Screen', ticket.screenNumber],
       ['Movie', ticket.moviePoster],
       ['Title', ticket.movieTitle],
       ['Cinema', ticket.cinemaName],
       ['Seats', `${ticket.seats.join(', ')} (${ticket.seats.length})`],
      ].map(([label, value], idx) => (
        <tr key={idx} className={`border-b border-slate-700 ${idx % 2 === 0 ? 'bg-slate-900/50' : ''}`}>
          <td className="px-4 py-3 font-semibold text-slate-300">{label}</td>
          <td className="px-4 py-3 text-white">{value}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
              </div>

              {/* Bottom */}
              <div className="mt-8 pt-6 border-t border-slate-700 flex justify-between items-end">
                <div>
                  <p className="text-slate-400 text-sm">Total Paid</p>
                  <p className="text-3xl font-bold text-white">
                    ${ticket.totalAmount.toFixed(2)}
                  </p>
                </div>

                {/* ✅ QR CODE */}
                <div className="bg-white p-2 rounded-lg">
                  <img
                    src={qrCodeUrl}
                    alt="Ticket QR"
                    className="w-24 h-24"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-800 p-6 flex justify-between items-center border-t border-slate-700">
          <p className="text-xs text-slate-500 max-w-sm">
            Tickets are non-refundable. Please present this QR code at the cinema entrance.
          </p>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700"
            >
              Done
            </button>

            <button 
              onClick={onDownload}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold"
            >
              ⬇️ Download PDF
            </button>
          </div>
        </div>

      </div>

      {/* ✅ TICKET SHAPE CSS */}
      <style>{`
        .ticket-shape {
          clip-path: polygon(
            0% 0%,
            100% 0%,
            100% 20%,
            95% 25%,
            100% 30%,
            100% 70%,
            95% 75%,
            100% 80%,
            100% 100%,
            0% 100%,
            0% 80%,
            5% 75%,
            0% 70%,
            0% 30%,
            5% 25%,
            0% 20%
          );
        }
      `}</style>

    </div>
  );
};
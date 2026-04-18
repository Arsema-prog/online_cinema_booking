import React from 'react';
import { SEAT_UUID_MAPPING, TOTAL_SEATS, getBookingSeatId } from './seatMapping';

export const SeatMappingTest: React.FC = () => {
  const testSeats = [1, 2, 3, 26, 50, 100];
  
  return (
    <div>
      <h2>Seat Mapping Test</h2>
      <p>Total seats mapped: {TOTAL_SEATS}</p>
      <h3>Sample Mappings:</h3>
      <ul>
        {testSeats.map(seat => (
          <li key={seat}>
            Core Seat {seat}: {getBookingSeatId(seat) || 'NOT FOUND'}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SeatMappingTest;

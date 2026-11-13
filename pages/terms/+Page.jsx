import React from "react";
import LegalLayout from "../../src/components/LegalLayout";

export default function Page() {
  return (
    <LegalLayout title="Terms & Conditions">
      <h2>1. Acceptance of Terms</h2>
      <p>By booking a ride through Abhi Cabs, you agree to these Terms &amp; Conditions and our Privacy Policy. If you do not agree, please do not use our services.</p>

      <h2>2. Bookings</h2>
      <ul>
        <li>Your trip has a KM limit and in case of certain special packages may even contain an Hours limit. If your usage exceeds these limits, you will be charged for the excess KM used (and/or hour if applicable).</li>
        <li>Fares shown at the time of booking are estimates based on the details you provide; final fares may vary with route changes, waiting time or additional stops</li>
        <li>Booking confirmation is sent once payment (or a valid payment method) is verified</li>
        <li>You are responsible for providing accurate pickup, drop and contact details</li>
        <li>Please ensure you have covered all cities you plan to visit in your itinerary. This will help our driver prepare accordingly. Adding a city to the itinerary during the trip may not be possible.</li>
      </ul>

      <h2>3. Fare Inclusions</h2>
      <ul>
        <li>Base fare and fuel charges for the trip</li>
        <li>Driver allowance (bata)</li>
        <li>GST (5%)</li>
        <li>AC vehicle</li>
        <li>Luggage allowance (2 bags)</li>
      </ul>

      <h2>4. Fare Exclusions</h2>
      <ul>
        <li>Toll / State tax (charged at actuals)</li>
        <li>Parking charges</li>
        <li>Extra kilometres beyond the package limit</li>
        <li>Airport / railway station entry charges</li>
        <li>Night driving allowance (9:45 PM – 6:00 AM) — ₹300 per night, paid directly to the driver</li>
      </ul>

      <h2>5. Night Driving</h2>
      <p>For driving between 09:45 PM to 06:00 AM on any of the nights, an additional allowance will be applicable and is to be paid to the driver.</p>

      <h2>6. Driver Conduct</h2>
      <ul>
        <li>All drivers are expected to follow traffic laws and treat passengers respectfully. Please report any concerns immediately through Contact &amp; Support.</li>
        <li>The driver would require periodic tea-breaks and meal-breaks, which can be coordinated directly with him.</li>
        <li>If you have a preference for a route, you can suggest to the driver but driver will use the route best suited.</li>
      </ul>

      <h2>7. Passenger Responsibilities</h2>
      <ul>
        <li>Be ready at the pickup location at the scheduled time</li>
        <li>Do not carry prohibited or illegal items in the vehicle</li>
        <li>Treat the vehicle and driver with respect</li>
        <li>If your trip has hill climbs, cab AC may be switched off during such climbs</li>
        <li>At the end of the trip, please check and take all your belongings with you</li>
      </ul>

      <h2>8. Payments</h2>
      <p>We accept UPI, cards, net banking and, where supported, cash. All applicable taxes are included in the fare shown at checkout unless stated otherwise. 5% GST will be charged on each request.</p>

      <h2>9. Cancellations &amp; Refunds</h2>
      <p>Please see our <a href="/cancellation">Cancellation &amp; Refund Policy</a> for full details on cancellation windows and refund timelines.</p>

      <h2>10. Vehicle Substitution</h2>
      <p>ABHI CABS reserves the right to substitute a vehicle of equivalent or superior category in case of unforeseen circumstances.</p>

      <h2>11. Billing Disputes</h2>
      <p>Any discrepancies regarding bill amount will be considered within 24 hrs of Invoice.</p>

      <h2>12. Limitation of Liability</h2>
      <p>Abhi Cabs is not liable for delays caused by traffic, weather, or events outside our reasonable control. We will make reasonable efforts to notify you of any expected delays.</p>

      <h2>13. Changes to These Terms</h2>
      <p>We may update these terms from time to time. Continued use of our services after changes means you accept the updated terms.</p>

      <h2>14. Contact</h2>
      <p>Questions about these terms can be sent to <a href="mailto:support@abhicabs.in">support@abhicabs.in</a>.</p>
    </LegalLayout>
  );
}

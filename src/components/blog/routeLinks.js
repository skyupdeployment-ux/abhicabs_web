/**
 * "Book this route" → the existing one-way service page, whose embedded BookingWidget
 * (the same one as Home) reads ?from= & ?to= and opens pre-filled. Home is untouched.
 */
export const bookRouteHref = ({ from, to }) =>
  `/services/one-way-outstation?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}#booking`;

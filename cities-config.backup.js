import { CITY_CONTENT } from "../../../src/content/cityDefaults";

export default {
  title: ({ routeParams }) => CITY_CONTENT[routeParams?.slug]?.seo?.title || "City Cab Booking – Abhi Cabs 24×7",
  description: ({ routeParams }) => CITY_CONTENT[routeParams?.slug]?.seo?.description || "Book cabs with Abhi Cabs 24×7.",
};

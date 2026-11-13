/**
 * DEVELOPMENT SAMPLE CONTENT — not real Abhi Cabs articles.
 * Shown only in `npm run dev` or when VITE_BLOG_SAMPLE_DATA=true, and only while
 * src/data/blogs.js has no published posts. A visible banner marks every page using it.
 * Same shape as posts published from the Blog Builder, so the real ones drop straight in.
 *
 * Tag conventions (Blog Builder → Tags): featured · popular · destination · tips · route,
 * and optionally  from:Bangalore  to:Mysore  on route posts.
 */
const p = (text) => ({ type: "p", text });
const h2 = (text) => ({ type: "h2", text });
const h3 = (text) => ({ type: "h3", text });
const ul = (...text) => ({ type: "ul", text });
const img = (src, alt, caption) => ({ type: "image", src, alt, caption });

export const SAMPLE_BLOGS = [
  {
    id: 8, slug: "sample-bangalore-to-mysore-road-trip", category: "Road Trips", author: "Abhi Cabs", date: "Oct 28, 2026", sample: true,
    title: "Bangalore to Mysore by Cab: A Relaxed Road-Trip Guide", headline: "Bangalore to Mysore by Cab: A Relaxed Road-Trip Guide",
    description: "How to plan an easy Bangalore–Mysore day trip or weekend: when to leave, where to pause and how to keep the drive comfortable.",
    image: "/images/route-1.webp", imageAlt: "A scenic highway road trip", tags: ["featured", "route", "from:Bangalore", "to:Mysore", "road trip", "weekend"],
    sections: [
      p("Bangalore to Mysore is one of the most popular short outstation trips in Karnataka, and it works equally well as a single day out or a relaxed weekend. A little planning makes the drive far more enjoyable."),
      h2("Choose the right time to leave"),
      p("Starting early lets you stay ahead of city traffic and reach Mysore with the whole day in front of you. If you are returning the same day, plan to start back before evening so you are not driving the final stretch tired."),
      img("/images/route-1.webp", "Highway scenery on the way to Mysore", "Leaving early makes the drive calmer."),
      h2("Plan your pauses"),
      p("Break the journey into two comfortable stretches instead of driving straight through. A short stop for tea, a stretch and a washroom break keeps everyone fresher, especially children and older passengers."),
      ul("Carry water and light snacks", "Keep a charger and a power bank handy", "Share the plan with someone at home"),
      h2("Booking a cab for the trip"),
      p("A one-way cab works if you are staying on in Mysore; a round trip keeps the same driver with you for the return. Enter your pickup and drop in the booking form to see the fare before you confirm."),
    ],
  },
  {
    id: 7, slug: "sample-airport-travel-tips", category: "Travel Tips", author: "Abhi Cabs", date: "Oct 24, 2026", sample: true,
    title: "Airport Transfer Tips: Reach Your Flight Without the Stress", headline: "Airport Transfer Tips: Reach Your Flight Without the Stress",
    description: "Simple habits that make airport pickups and drops smoother — from booking ahead to knowing your terminal.",
    image: "/images/airport.webp", imageAlt: "Travellers at an airport drop-off", tags: ["popular", "tips", "airport"],
    sections: [
      p("Airport journeys have little room for error. A few small decisions before the day make the ride calm and on time."),
      h2("Book ahead, especially for early flights"),
      p("For early-morning departures, book the cab the night before so the driver is confirmed and nearby. Last-minute bookings at odd hours are the ones that go wrong."),
      h2("Know your terminal"),
      p("Check which terminal your airline uses before you leave, and tell the driver at pickup. It avoids a detour once you arrive."),
      h2("Build in a buffer"),
      ul("Leave earlier than you think you need to", "Keep your ticket and ID within reach, not in the boot", "Save the driver's number once the cab is assigned"),
      p("For a drop, the booking form lets you pick the airport and direction directly, so the fare is shown up front."),
    ],
  },
  {
    id: 6, slug: "sample-weekend-getaways-from-bangalore", category: "Destinations", author: "Abhi Cabs", date: "Oct 20, 2026", sample: true,
    title: "Weekend Getaways from Bangalore You Can Do by Cab", headline: "Weekend Getaways from Bangalore You Can Do by Cab",
    description: "Hill stations, heritage towns and green escapes within a comfortable drive of Bangalore.",
    image: "/images/weekend.webp", imageAlt: "A weekend getaway road", tags: ["popular", "destination", "weekend", "hill stations"],
    sections: [
      p("When the week has been long, a weekend away is the quickest reset. These are the kinds of places that suit a Friday-evening or Saturday-morning start from Bangalore."),
      h2("Hill stations"),
      p("Coorg and Ooty are classic choices for cool air, coffee estates and tea gardens. Both are better with a rested driver who knows the ghat roads."),
      h2("Heritage and culture"),
      p("Mysore and Hampi reward slow exploring — palaces, temples and ruins. Plan fewer places and spend longer at each."),
      h2("How to choose"),
      ul("Decide how many hours you want to spend on the road", "Pick a place that matches your group — families and friends want different things", "Book a round trip so one driver stays with you"),
    ],
  },
  {
    id: 5, slug: "sample-family-road-trip-advice", category: "Travel Tips", author: "Abhi Cabs", date: "Oct 15, 2026", sample: true,
    title: "Family Road-Trip Advice: Keeping Everyone Comfortable", headline: "Family Road-Trip Advice: Keeping Everyone Comfortable",
    description: "Practical ideas for travelling with children and elders — vehicle choice, pauses and packing.",
    image: "/images/family.webp", imageAlt: "A family getting ready for a road trip", tags: ["tips", "family"],
    sections: [
      p("A good family trip is mostly about comfort. Get the basics right and the rest takes care of itself."),
      h2("Pick the right vehicle"),
      p("Count passengers and luggage together. An SUV or MPV gives everyone room; a sedan is fine for a small group with light bags."),
      h2("Plan for pauses"),
      p("Children and older passengers do better with regular breaks. Agree on stops before you start rather than deciding on the road."),
      h2("Pack smart"),
      ul("Keep medicines, water and snacks in the cabin, not the boot", "Bring a light blanket or shawl for AC", "Keep documents together in one bag"),
    ],
  },
  {
    id: 4, slug: "sample-monsoon-travel-precautions", category: "Travel Tips", author: "Abhi Cabs", date: "Oct 10, 2026", sample: true,
    title: "Monsoon Travel Precautions for Long Drives", headline: "Monsoon Travel Precautions for Long Drives",
    description: "What to check and how to adjust your plan when you are travelling in the rain.",
    image: "/images/mountain-road-full.jpg", imageAlt: "A misty mountain road in the monsoon", tags: ["tips", "safety", "monsoon"],
    sections: [
      p("Rain turns a familiar road into a different drive. A little extra care keeps a monsoon trip safe and pleasant."),
      h2("Give yourself more time"),
      p("Plan for a slower journey and avoid tight connections. Reaching late is always better than rushing."),
      h2("Choose daylight where you can"),
      p("Visibility is lower in heavy rain, and ghat sections are easier to cover in daylight."),
      ul("Check the weather and road updates before leaving", "Keep your phone charged for navigation", "Let the driver decide when a pause is needed"),
    ],
  },
  {
    id: 3, slug: "sample-coorg-travel-guide", category: "Travel Guides", author: "Abhi Cabs", date: "Oct 05, 2026", sample: true,
    title: "Coorg Travel Guide: Coffee Estates and Cool Weather", headline: "Coorg Travel Guide: Coffee Estates and Cool Weather",
    description: "An easy introduction to planning a trip to Coorg — what to see, how long to stay and how to get there.",
    image: "/images/route-2.webp", imageAlt: "Green hills of Coorg", tags: ["destination", "route", "from:Bangalore", "to:Coorg", "hill stations"],
    sections: [
      p("Coorg (Kodagu) is known for coffee estates, misty hills and waterfalls. It suits a long weekend better than a single day."),
      h2("How long to stay"),
      p("Two nights lets you enjoy the place without spending the whole trip in the car."),
      h2("Getting there"),
      p("A round trip keeps the same driver for the hill roads and local sightseeing, so you are not arranging transport at each stop."),
      ul("Carry light layers for the evenings", "Book stays in advance for weekends", "Start early to enjoy the drive"),
    ],
  },
  {
    id: 2, slug: "sample-long-distance-trip-preparation", category: "Travel Guides", author: "Abhi Cabs", date: "Sep 28, 2026", sample: true,
    title: "Preparing for a Long-Distance Cab Journey", headline: "Preparing for a Long-Distance Cab Journey",
    description: "A short checklist for outstation travel — before you book, before you leave and while on the road.",
    image: "/images/route-3.webp", imageAlt: "A long highway stretching ahead", tags: ["tips", "outstation", "booking"],
    sections: [
      p("Outstation trips go smoothly when the details are settled early. Use this as a quick checklist."),
      h2("Before you book"),
      ul("Decide one-way or round trip", "Confirm pickup time and location", "Check the fare shown in the booking flow"),
      h2("Before you leave"),
      p("Keep your booking details and the driver's contact handy, and share your trip plan with family."),
      h2("On the road"),
      p("Agree on rest stops, keep valuables with you and speak up if you want to adjust the plan."),
    ],
  },
  {
    id: 1, slug: "sample-hampi-heritage-guide", category: "Destinations", author: "Abhi Cabs", date: "Sep 20, 2026", sample: true,
    title: "Hampi: A Heritage Weekend Worth the Drive", headline: "Hampi: A Heritage Weekend Worth the Drive",
    description: "Temples, boulders and ruins — how to plan a weekend in Hampi without rushing it.",
    image: "/images/route-6.webp", imageAlt: "Ancient ruins and boulders at Hampi", tags: ["destination", "route", "from:Bangalore", "to:Hampi", "heritage"],
    sections: [
      p("Hampi is a UNESCO World Heritage site with temples and ruins spread across a boulder-strewn landscape. It is a long drive from Bangalore, so give it at least a weekend."),
      h2("Plan the journey"),
      p("Break the drive with a proper stop and arrive with time to spare. A round trip keeps one driver with you throughout."),
      h2("Make the most of it"),
      ul("Start sightseeing early to avoid the midday heat", "Wear comfortable shoes", "Carry water — shade can be limited"),
    ],
  },
];

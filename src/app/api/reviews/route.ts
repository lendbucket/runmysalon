import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";

const LOCATIONS: Record<string, { label: string; placeId: string }> = {
  CC: { label: "Corpus Christi", placeId: "ChIJH_SrmdP1aIYRNxsROAU2fJg" },
  SA: { label: "San Antonio", placeId: "ChIJZx49Ymj1XIYR14gIsIGiKPQ" },
};

export async function GET(request: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Places API key not configured" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const locationFilter = searchParams.get("location"); // "CC" | "SA" | null (both)

  const targets = locationFilter && LOCATIONS[locationFilter]
    ? { [locationFilter]: LOCATIONS[locationFilter] }
    : LOCATIONS;

  const results = await Promise.all(
    Object.entries(targets).map(async ([key, { label, placeId }]) => {
      const url =
        `https://maps.googleapis.com/maps/api/place/details/json` +
        `?place_id=${placeId}` +
        `&fields=name,rating,user_ratings_total,reviews,formatted_address` +
        `&key=${apiKey}` +
        `&reviews_sort=newest`;

      const res = await fetch(url, { next: { revalidate: 300 } });
      const data = await res.json();
      const result = data.result || {};

      return {
        location: key,
        label,
        rating: result.rating ?? 0,
        totalReviews: result.user_ratings_total ?? 0,
        formattedAddress: result.formatted_address ?? "",
        reviews: (result.reviews || []).map(
          (r: {
            author_name?: string;
            rating?: number;
            text?: string;
            relative_time_description?: string;
            profile_photo_url?: string;
          }) => ({
            authorName: r.author_name || "Anonymous",
            rating: r.rating ?? 0,
            text: r.text || "",
            relativeTime: r.relative_time_description || "",
            photoUrl: r.profile_photo_url || "",
          }),
        ),
        reviewUrl: `https://search.google.com/local/writereview?placeid=${placeId}`,
        googleMapsUrl: `https://maps.google.com/?cid=${placeId}`,
      };
    }),
  );

  return NextResponse.json({ locations: results });
}

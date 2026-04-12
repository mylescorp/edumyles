import { NextRequest, NextResponse } from "next/server";

const REGIONS_ENDPOINT = "https://countriesnow.space/api/v0.1/countries/states";

type CountriesNowState = {
  name?: string;
  state_code?: string;
};

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country")?.trim();

  if (!country) {
    return NextResponse.json({ error: "Country is required" }, { status: 400 });
  }

  try {
    const response = await fetch(REGIONS_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ country }),
      next: {
        revalidate: 60 * 60 * 24,
      },
    });

    if (!response.ok) {
      throw new Error(`Region lookup failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      data?: {
        states?: CountriesNowState[];
      };
    };

    const items = (payload.data?.states ?? [])
      .map((region) => ({
        label: region.name?.trim() ?? "",
        value: region.name?.trim() ?? "",
        code: region.state_code?.trim() ?? "",
      }))
      .filter((region) => region.value.length > 0)
      .sort((left, right) => left.label.localeCompare(right.label));

    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load regions";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

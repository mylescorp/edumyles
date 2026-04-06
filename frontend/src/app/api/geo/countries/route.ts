import { NextResponse } from "next/server";

const COUNTRIES_ENDPOINT = "https://countriesnow.space/api/v0.1/countries/positions";

type CountriesNowCountry = {
  name?: string;
  iso2?: string;
};

export async function GET() {
  try {
    const response = await fetch(COUNTRIES_ENDPOINT, {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 60 * 60 * 24,
      },
    });

    if (!response.ok) {
      throw new Error(`Country lookup failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      data?: CountriesNowCountry[];
    };

    const items = (payload.data ?? [])
      .map((country) => ({
        label: country.name?.trim() ?? "",
        value: country.name?.trim() ?? "",
        iso2: country.iso2?.trim() ?? "",
      }))
      .filter((country) => country.value.length > 0)
      .sort((left, right) => left.label.localeCompare(right.label));

    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load countries";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

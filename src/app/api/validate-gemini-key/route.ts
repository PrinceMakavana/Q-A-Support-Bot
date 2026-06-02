import { NextResponse } from "next/server";

const GEMINI_MODELS_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export async function POST(req: Request) {
  try {
    const { googleApiKey: rawGoogleApiKey } = await req.json();
    const googleApiKey =
      typeof rawGoogleApiKey === "string" ? rawGoogleApiKey.trim() : "";

    if (!googleApiKey) {
      return NextResponse.json(
        { error: "Gemini API key is required" },
        { status: 400 }
      );
    }

    const response = await fetch(GEMINI_MODELS_URL, {
      method: "GET",
      headers: {
        "x-goog-api-key": googleApiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      let message = "Gemini API key is invalid or does not have model access";

      try {
        const data = await response.json();
        if (typeof data?.error?.message === "string") {
          message = data.error.message;
        }
      } catch {
        // Keep the generic message when Google returns a non-JSON error body.
      }

      return NextResponse.json(
        { error: message },
        { status: response.status === 403 ? 401 : response.status }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to validate Gemini API key";
    console.error("Gemini key validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate Gemini API key", details: message },
      { status: 500 }
    );
  }
}

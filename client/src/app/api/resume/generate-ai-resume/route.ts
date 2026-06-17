import { NextRequest, NextResponse } from "next/server";
import { axiosInstance } from "@/API/axiosInstance";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { themeNo, pageCount } = body;

    // Get cookies from request
    const cookies = request.cookies;
    const token = cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "No authentication token" },
        { status: 401 }
      );
    }

    // Forward the request to the backend with cookies
    const response = await axiosInstance.post(
      "/api/resume/generate-ai-resume",
      { themeNo, pageCount },
      {
        headers: {
          Cookie: `token=${token}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.message || error.message,
      },
      { status: error.response?.status || 500 }
    );
  }
}

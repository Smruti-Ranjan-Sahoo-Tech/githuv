import { NextRequest, NextResponse } from "next/server";
import { axiosInstance } from "@/API/axiosInstance";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await context.params;
    const body = await request.json();
    const cookies = request.cookies;
    const token = cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "No authentication token" },
        { status: 401 }
      );
    }

    const response = await axiosInstance.post(
      `/api/resume/feedback/${threadId}`,
      body,
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

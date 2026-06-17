import { NextRequest, NextResponse } from "next/server";
import { axiosInstance } from "@/API/axiosInstance";

export async function GET(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const { threadId } = params;
    const cookies = request.cookies;
    const token = cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "No authentication token" },
        { status: 401 }
      );
    }

    const response = await axiosInstance.get(`/api/resume/latex/${threadId}`, {
      headers: {
        Cookie: `token=${token}`,
      },
    });

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

import cloudinary from "../../config/cloudinary";
import { Resume } from "../../models/resume.model";
import mongoose from "mongoose";

const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL || "http://localhost:3005";

export async function compileLatexToPdfBuffer(latexCode: string): Promise<Buffer> {
  const response = await fetch(`${PDF_SERVICE_URL}/compile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latex: latexCode }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PDF compilation failed: ${text}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function uploadPdfToCloudinary(
  pdfBuffer: Buffer,
  userId: string,
  version: number
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        type: "upload",
        folder: `resumes/${userId}`,
        public_id: `resume-v${version}`,
        format: "pdf",
        use_filename: true,
        unique_filename: false,
        overwrite: true,
        access_mode: "public",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
        } else {
          console.log("Cloudinary upload success:", result?.secure_url);
          resolve({ url: result!.secure_url, publicId: result!.public_id });
        }
      }
    );
    uploadStream.end(pdfBuffer);
  });
}

export async function deleteCloudinaryPdf(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch {
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
  }
}

export async function saveResumeRecord(params: {
  userId: mongoose.Types.ObjectId | string;
  firebaseUID: string;
  threadId: string;
  latexCode: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  version: number;
  name?: string;
}) {
  await Resume.findOneAndUpdate(
    { firebaseUID: params.firebaseUID, isLatest: true },
    { isLatest: false }
  );

  const resume = await Resume.create({
    user: params.userId,
    firebaseUID: params.firebaseUID,
    threadId: params.threadId,
    latexCode: params.latexCode,
    cloudinaryUrl: params.cloudinaryUrl,
    cloudinaryPublicId: params.cloudinaryPublicId,
    version: params.version,
    name: params.name || `version_${params.version}`,
    isLatest: true,
  });

  const allResumes = await Resume.find({ firebaseUID: params.firebaseUID }).sort(
    { version: -1 }
  );

  if (allResumes.length > 50) {
    const toDelete = allResumes.slice(50);
    for (const doc of toDelete) {
      try {
        await deleteCloudinaryPdf(doc.cloudinaryPublicId);
      } catch (e) {
        console.error("Failed to delete old Cloudinary PDF:", e);
      }
      await Resume.deleteOne({ _id: doc._id });
    }
  }

  return resume;
}

export async function getNextVersion(firebaseUID: string): Promise<number> {
  const last = await Resume.findOne({ firebaseUID })
    .sort({ version: -1 })
    .select("version");
  return last ? last.version + 1 : 1;
}

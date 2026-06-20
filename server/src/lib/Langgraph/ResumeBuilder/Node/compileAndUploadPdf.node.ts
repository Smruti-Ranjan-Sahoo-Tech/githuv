import { type ResumeState } from "../State";
import {
  compileLatexToPdfBuffer,
  uploadPdfToCloudinary,
  saveResumeRecord,
  getNextVersion,
} from "../../../pdf/compileAndUpload";

export async function compileAndUploadPdf(state: ResumeState): Promise<Partial<ResumeState>> {
  const pdfBuffer = await compileLatexToPdfBuffer(state.latexCode);

  const firebaseUID = state.userId || "demo-user";
  const version = await getNextVersion(firebaseUID);

  const { url, publicId } = await uploadPdfToCloudinary(pdfBuffer, firebaseUID, version);

  await saveResumeRecord({
    userId: state.userObjectId,
    firebaseUID,
    threadId: state.threadId,
    latexCode: state.latexCode,
    cloudinaryUrl: url,
    cloudinaryPublicId: publicId,
    version,
  });

  return { pdfUrl: url, cloudinaryPublicId: publicId };
}

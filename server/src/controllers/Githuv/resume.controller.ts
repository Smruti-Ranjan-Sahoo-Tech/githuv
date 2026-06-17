import cloudinary from "../../config/cloudinary";
import { Resume } from "../../models/resume.model";
import { User } from "../../models/user.model";
import { resumeGraph } from "../../lib/Langgraph/ResumeBuilder/Graph";
import {
  compileLatexToPdfBuffer,
  deleteCloudinaryPdf,
  getNextVersion,
  uploadPdfToCloudinary,
  saveResumeRecord,
} from "../../lib/pdf/compileAndUpload";

class ResumeController {
  static async generateResumeByAi(req: any, res: any) {
    try {
      console.log("📌 Starting resume generation...");
      const user = req.user;
      console.log("✓ User:", user?.firebaseUID);
      
      const { pageCount, themeNo } = req.body;
      console.log("✓ Parameters:", { pageCount, themeNo });
      
      const firebaseUID = user.firebaseUID;
      const threadId = crypto.randomUUID();
      console.log("✓ ThreadId:", threadId);

      console.log("⏳ Invoking resume graph...");
      const result = await resumeGraph.invoke({
        userId: firebaseUID,
        threadId: threadId,
        themeNo: themeNo || "Theme1",
        pageCount: pageCount || 1,
      });
      
      console.log("✓ Graph result:", { hasLatexCode: !!result.latexCode, hasPdfUrl: !!result.pdfUrl });

      return res.status(200).json({
        success: true,
        threadId: threadId,
        result: {
          latexCode: result.latexCode,
          pdfUrl: result.pdfUrl,
          cloudinaryPublicId: result.cloudinaryPublicId,
          themeNo: themeNo || "Theme1",
          pageCount: pageCount || 1,
        },
      });
    } catch (error: any) {
      console.error("❌ Resume generation error:");
      console.error("Error message:", error?.message || "No message");
      console.error("Error code:", error?.code || "No code");
      if (error?.stack) {
        console.error("Stack trace:", error.stack.substring(0, 500));
      }
      
      return res.status(500).json({
        success: false,
        message: error?.message || "Unknown error during resume generation",
      });
    }
  }

  static async generateScratch(req: any, res: any) {
    try {
      const { latexCode, name } = req.body;
      const { firebaseUID } = req.user;
      const threadId = crypto.randomUUID();

      const user = await User.findOne({ firebaseUID });
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const pdfBuffer = await compileLatexToPdfBuffer(latexCode);
      const version = await getNextVersion(firebaseUID);
      const { url, publicId } = await uploadPdfToCloudinary(
        pdfBuffer,
        firebaseUID,
        version
      );

      const record = await saveResumeRecord({
        userId: user._id,
        firebaseUID,
        threadId,
        latexCode,
        cloudinaryUrl: url,
        cloudinaryPublicId: publicId,
        version,
        name,
      });

      return res.status(200).json({
        success: true,
        data: {
          threadId,
          version,
          name: record.name,
          cloudinaryUrl: url,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async listResumes(req: any, res: any) {
    try {
      const user = req.user;
      const firebaseUID = user.firebaseUID;

      const resumes = await Resume.find({ firebaseUID })
        .sort({ version: -1 })
        .select("version name cloudinaryUrl cloudinaryPublicId isLatest threadId createdAt");

      return res.status(200).json({
        success: true,
        resumes,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getLatexByThreadId(req: any, res: any) {
    try {
      const { threadId } = req.params;
      const user = req.user;

      const resume = await Resume.findOne({
        threadId,
        firebaseUID: user.firebaseUID,
      }).select("latexCode threadId version cloudinaryUrl name");

      if (!resume) {
        return res.status(404).json({
          success: false,
          message: "Resume not found",
        });
      }

      return res.status(200).json({
        success: true,
        latexCode: resume.latexCode,
        threadId: resume.threadId,
        version: resume.version,
        cloudinaryUrl: resume.cloudinaryUrl,
        name: resume.name,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async regenerateResume(req: any, res: any) {
    try {
      const { latexCode, threadId, name } = req.body;
      const { firebaseUID } = req.user;

      if (!latexCode) {
        return res.status(400).json({
          success: false,
          message: "latexCode is required",
        });
      }

      const user = await User.findOne({ firebaseUID });
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const pdfBuffer = await compileLatexToPdfBuffer(latexCode);
      const version = await getNextVersion(firebaseUID);
      const { url, publicId } = await uploadPdfToCloudinary(
        pdfBuffer,
        firebaseUID,
        version
      );

      const record = await saveResumeRecord({
        userId: user._id,
        firebaseUID,
        threadId: threadId || crypto.randomUUID(),
        latexCode,
        cloudinaryUrl: url,
        cloudinaryPublicId: publicId,
        version,
        name,
      });

      return res.status(200).json({
        success: true,
        data: {
          threadId: record.threadId,
          version: record.version,
          name: record.name,
          cloudinaryUrl: url,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async compileLatex(req: any, res: any) {
    try {
      const { latexCode } = req.body;

      if (!latexCode) {
        return res.status(400).json({
          success: false,
          message: "latexCode is required",
        });
      }

      const pdfBuffer = await compileLatexToPdfBuffer(latexCode);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'inline; filename="resume.pdf"');
      return res.send(pdfBuffer);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async chatWithAI(req: any, res: any) {
    try {
      const { threadId } = req.params;
      const { message, latexCode } = req.body;

      // Placeholder: integrate with AI LangGraph chat
      return res.status(200).json({
        success: true,
        latexCode,
        message: "Chat integration placeholder",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async feedback(req: any, res: any) {
    try {
      const { threadId } = req.params;
      const { feedback } = req.body;

      // Placeholder: integrate with AI feedback loop
      return res.status(200).json({
        success: true,
        message: "Feedback received",
        feedback,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async deleteResume(req: any, res: any) {
    try {
      const { threadId } = req.params;
      const { firebaseUID } = req.user;

      const resume = await Resume.findOne({ threadId, firebaseUID });
      if (!resume) {
        return res.status(404).json({ success: false, message: "Resume not found" });
      }

      await deleteCloudinaryPdf(resume.cloudinaryPublicId);
      await Resume.deleteOne({ _id: resume._id });

      return res.status(200).json({ success: true, message: "Resume deleted" });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateResume(req: any, res: any) {
    try {
      const { threadId } = req.params;
      const { latexCode, name } = req.body;
      const { firebaseUID } = req.user;

      if (!latexCode) {
        return res.status(400).json({ success: false, message: "latexCode is required" });
      }

      const existing = await Resume.findOne({ threadId, firebaseUID });
      if (!existing) {
        return res.status(404).json({ success: false, message: "Resume not found" });
      }

      const pdfBuffer = await compileLatexToPdfBuffer(latexCode);
      const version = await getNextVersion(firebaseUID);
      const { url, publicId } = await uploadPdfToCloudinary(pdfBuffer, firebaseUID, version);

      await deleteCloudinaryPdf(existing.cloudinaryPublicId);
      await Resume.deleteOne({ _id: existing._id });

      const record = await saveResumeRecord({
        userId: existing.user,
        firebaseUID,
        threadId,
        latexCode,
        cloudinaryUrl: url,
        cloudinaryPublicId: publicId,
        version,
        name,
      });

      return res.status(200).json({
        success: true,
        data: {
          threadId: record.threadId,
          version: record.version,
          name: record.name,
          cloudinaryUrl: url,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async servePdfByThreadId(req: any, res: any) {
    try {
      const { threadId } = req.params;
      const { firebaseUID } = req.user;

      const resume = await Resume.findOne({ threadId, firebaseUID });
      if (!resume) {
        return res.status(404).json({ success: false, message: "Resume not found" });
      }

      const filename = `${resume.name || `resume-v${resume.version}`}.pdf`;
      const publicId = resume.cloudinaryPublicId;

      const resourceTypes = ["image", "raw"];

      const fetchBuffer = async (url: string): Promise<Buffer | null> => {
        try {
          const resp = await fetch(url, { headers: { Accept: "application/pdf" } });
          if (resp.ok) return Buffer.from(await resp.arrayBuffer());
          console.warn(`Failed to fetch ${url.substring(0, 80)}...: ${resp.status}`);
        } catch (err: any) {
          console.warn(`Fetch error: ${err.message}`);
        }
        return null;
      };

      let pdfBuffer: Buffer | null = null;

      // Strategy 1 & 2: signed private download URL (uses API auth, always works)
      for (const rt of resourceTypes) {
        if (pdfBuffer) break;
        try {
          const privateUrl = cloudinary.utils.private_download_url(publicId, "pdf", {
            resource_type: rt,
            type: "upload",
            attachment: false,
          });
          pdfBuffer = await fetchBuffer(privateUrl);
        } catch (err: any) {
          console.warn(`private_download_url (${rt}) error: ${err.message}`);
        }
      }

      // Strategy 3 & 4: signed CDN URL (works if CDN access allows)
      for (const rt of resourceTypes) {
        if (pdfBuffer) break;
        try {
          const signedUrl = cloudinary.url(publicId, {
            resource_type: rt,
            type: "upload",
            format: "pdf",
            secure: true,
            sign_url: true,
          });
          pdfBuffer = await fetchBuffer(signedUrl);
        } catch (err: any) {
          console.warn(`signed URL (${rt}) error: ${err.message}`);
        }
      }

      // Strategy 5 & 6: unsigned URL (fallback for public assets)
      for (const rt of resourceTypes) {
        if (pdfBuffer) break;
        try {
          const rawUrl = cloudinary.url(publicId, {
            resource_type: rt,
            type: "upload",
            format: "pdf",
            secure: true,
            sign_url: false,
          });
          pdfBuffer = await fetchBuffer(rawUrl);
        } catch (err: any) {
          console.warn(`unsigned URL (${rt}) error: ${err.message}`);
        }
      }

      if (!pdfBuffer) {
        return res.status(502).json({ success: false, message: "Failed to fetch PDF from storage" });
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.send(pdfBuffer);
    } catch (error: any) {
      console.error("servePdfByThreadId error:", error.message);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getResumeData(req: any, res: any) {
    try {
      const user = req.user;
      const firebaseUID = user.firebaseUID;

      const latest = await Resume.findOne({ firebaseUID, isLatest: true })
        .select("latexCode threadId version cloudinaryUrl createdAt");

      const totalCount = await Resume.countDocuments({ firebaseUID });

      return res.status(200).json({
        success: true,
        data: {
          latest,
          totalCount,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default ResumeController
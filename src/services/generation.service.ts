import { handleResponse } from "../utils/api";
const API_URL = process.env.REACT_APP_API_URI || "";
const BASE_URL = API_URL.replace(/\/api$/, "");

function normalizeImagePath(raw: any): string {
  if (!raw || typeof raw !== "string") return "";
  const s = raw.trim();
  // If already an absolute URL, return as-is
  if (/^https?:\/\//i.test(s)) return s;

  // Replace backslashes with forward slashes (Windows paths)
  let p = s.replace(/\\/g, "/");

  // If the stored path contains '/uploads', keep only that part
  const uploadsIndex = p.indexOf("/uploads");
  if (uploadsIndex !== -1) {
    p = p.substring(uploadsIndex);
  } else {
    // If it contains 'uploads' without leading slash, try to locate and prefix
    const uploadsIndex2 = p.indexOf("uploads");
    if (uploadsIndex2 !== -1) {
      p = "/" + p.substring(uploadsIndex2);
    } else {
      // As a fallback, ensure it starts with a slash
      if (!p.startsWith("/")) p = "/" + p;
    }
  }

  return `${BASE_URL}${p}`;
}

export interface Generation {
  id: string;
  prompt: string;
  imagePath: string;
  createdAt: string;
}

export const generationService = {
  async uploadImage(
    image: File,
    prompt: string,
    token: string
  ): Promise<Generation> {
    const formData = new FormData();
    formData.append("image", image);
    formData.append("prompt", prompt);

    try {
      console.log("Uploading image with prompt:", prompt);
      const response = await fetch(`${API_URL}/generations/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log("Upload response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Upload failed:", errorData);
        throw new Error(errorData.error || "Upload failed");
      }

      const body = await handleResponse(response);
      const g = body.generation;
      const imagePath = normalizeImagePath(g.imagePath);

      return {
        id: g.id,
        prompt: g.prompt,
        imagePath,
        createdAt: g.createdAt,
      };
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  },

  async getRecentGenerations(token: string): Promise<Generation[]> {
    try {
      const response = await fetch(`${API_URL}/generations/recent`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to fetch generations:", errorData);
        throw new Error(errorData.error || "Failed to fetch generations");
      }

      const body = await handleResponse(response);
      // Ensure each generation has an absolute imagePath
      const gens = (body as any[]).map((g) => ({
        ...g,
        imagePath: normalizeImagePath(g.imagePath),
      }));

      return gens as Generation[];
    } catch (error) {
      console.error("Get generations error:", error);
      throw error;
    }
  },
};

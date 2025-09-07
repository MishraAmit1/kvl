import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";

// Initialize Supabase client with service role key for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export const uploadToSupabase = async (file, folder) => {
  if (!file || !file.path) {
    console.error("No file or file path provided");
    return null;
  }
  try {
    // Read file buffer
    const fileBuffer = await fs.readFile(file.path);
    const fileExt = path.extname(file.originalname).toLowerCase();
    const fileName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("kvl")
      .upload(filePath, fileBuffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("kvl")
      .getPublicUrl(filePath);

    // Delete local file
    await fs.unlink(file.path);

    return { url: publicUrlData.publicUrl };
  } catch (error) {
    try {
      await fs.unlink(file.path);
    } catch (unlinkError) {
      console.error("Failed to delete local file:", unlinkError);
    }
    console.error("Supabase upload error:", error);
    throw new Error("Failed to upload to Supabase", { cause: error });
  }
};

export const deleteFromSupabase = async (fileUrl, folder) => {
  if (!fileUrl) {
    console.warn("No file URL provided for deletion");
    return;
  }
  try {
    // Extract file path from URL
    const urlParts = fileUrl.split("/storage/v1/object/public/kvl/");
    if (urlParts.length < 2) {
      console.warn(`Invalid Supabase URL format: ${fileUrl}`);
      return;
    }
    const filePath = `${folder}/${urlParts[1].split("/").pop()}`;

    // Delete file from Supabase Storage
    const { error } = await supabase.storage.from("kvl").remove([filePath]);

    if (error) {
      console.error(`Failed to delete file from Supabase: ${filePath}`, error);
      throw error;
    }

    console.log(`Successfully deleted file from Supabase: ${filePath}`);
  } catch (error) {
    console.error(`Error deleting file from Supabase: ${fileUrl}`, error);
    // Don't throw error to allow MongoDB deletion to proceed
  }
};

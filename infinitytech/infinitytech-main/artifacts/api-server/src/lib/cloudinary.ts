import { v2 as cloudinary } from "cloudinary";

const REQUIRED_VARS = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
for (const key of REQUIRED_VARS) {
  if (!process.env[key] || process.env[key] === key) {
    console.error(`[Cloudinary] ⚠  ${key} is missing or is a placeholder — uploads will fail`);
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export function getUploadSignature(
  folder: string,
  publicId?: string,
  resourceType: "image" | "video" | "raw" = "image",
) {
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!secret || secret === "CLOUDINARY_API_SECRET") {
    throw new Error(
      "CLOUDINARY_API_SECRET is not configured. Please set it in Replit Secrets.",
    );
  }

  // Generate timestamp immediately before signing to minimise drift
  const timestamp = Math.round(Date.now() / 1000);

  // Build params then sort alphabetically — Cloudinary requires sorted params
  const rawParams: Record<string, string | number> = { folder, timestamp };
  if (publicId) rawParams.public_id = publicId;

  const params: Record<string, string | number> = {};
  for (const key of Object.keys(rawParams).sort()) {
    params[key] = rawParams[key];
  }

  const signature = cloudinary.utils.api_sign_request(params, secret);

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
    resourceType,
  };
}

export function injectCloudinaryTransforms(url: string, transforms: string): string {
  return url.replace(/\/upload\//, `/upload/${transforms}/`);
}

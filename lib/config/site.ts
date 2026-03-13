import "server-only";

export function getSiteUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (explicitUrl) {
    return explicitUrl.startsWith("http") ? explicitUrl : `https://${explicitUrl}`;
  }

  const productionVercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

  if (productionVercelUrl) {
    return `https://${productionVercelUrl}`;
  }

  const previewVercelUrl = process.env.VERCEL_URL?.trim();

  if (previewVercelUrl) {
    return `https://${previewVercelUrl}`;
  }

  return "http://localhost:3000";
}

/**
 * API configuration for the BrandForge web frontend.
 * Centralizes the backend base URL used by all fetch calls.
 */
const API_CONFIG = {
  baseUrl: "",
  endpoints: {
    generateBrand: "/generate-brand",
    exportPdf: "/export-pdf",
  },
};

/**
 * @param {string} endpoint
 * @returns {string}
 */
function apiUrl(endpoint) {
  return `${API_CONFIG.baseUrl}${endpoint}`;
}

/**
 * @param {string} idea
 * @returns {Promise<object>}
 */
async function fetchBrand(idea) {
  const response = await fetch(apiUrl(API_CONFIG.endpoints.generateBrand), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idea }),
  });

  if (!response.ok) {
    let message = "Server error";
    try {
      const body = await response.json();
      if (body.error) {
        message = body.error;
      }
    } catch (_) {
      // keep default message
    }
    throw new Error(message);
  }

  return response.json();
}

/**
 * @param {object} brandData
 * @returns {Promise<{ blob: Blob, filename: string }>}
 */
async function exportBrandPdf(brandData) {
  const response = await fetch(apiUrl(API_CONFIG.endpoints.exportPdf), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(brandData),
  });

  if (!response.ok) {
    let message = "PDF export failed. Please try again.";
    try {
      const body = await response.json();
      if (body.error) {
        message = body.error;
      }
    } catch (_) {
      // keep default message
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  let filename = "Brand-Brand-Kit.pdf";

  const disposition = response.headers.get("Content-Disposition");
  if (disposition) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match) {
      filename = match[1];
    }
  }

  return { blob, filename };
}

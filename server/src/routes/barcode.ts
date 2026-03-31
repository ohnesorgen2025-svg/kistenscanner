import { Router } from "express";

export const barcodeRouter = Router();

type OpenFoodFactsProduct = {
  product_name?: string;
  brands?: string;
  categories?: string;
  quantity?: string;
  image_url?: string;
};

barcodeRouter.get("/:code", async (request, response) => {
  const code = request.params.code.replace(/[^0-9]/g, "");

  if (code.length < 8 || code.length > 14) {
    return response.status(400).json({ error: "Ungültiger Barcode." });
  }

  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,brands,categories,quantity,image_url`;
    const apiResponse = await fetch(url, {
      headers: { "User-Agent": "kistenscanner/1.0" },
      signal: AbortSignal.timeout(5000),
    });

    if (!apiResponse.ok) {
      return response.json({ found: false, code });
    }

    const data = (await apiResponse.json()) as { status: number; product?: OpenFoodFactsProduct };

    if (data.status !== 1 || !data.product?.product_name) {
      return response.json({ found: false, code });
    }

    const p = data.product;
    const imageUrl = typeof p.image_url === "string" && p.image_url.startsWith("https://") ? p.image_url : null;
    return response.json({
      found: true,
      code,
      name: p.product_name,
      brand: p.brands ?? null,
      category: p.categories ?? null,
      quantity: p.quantity ?? null,
      imageUrl,
    });
  } catch {
    return response.json({ found: false, code });
  }
});

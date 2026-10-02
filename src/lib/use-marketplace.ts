"use client";

import { useEffect, useState } from "react";

import {
  getMarketplaceCategories,
  getMarketplaceProducts,
  type MarketplaceCategory,
  type MarketplaceProduct,
} from "./api";

export function useMarketplace() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMarketplaceProducts(), getMarketplaceCategories()])
      .then(([productList, categoryList]) => {
        if (cancelled) return;
        setProducts(productList);
        setCategories(categoryList);
      })
      .catch(() => {
        if (!cancelled) {
          setProducts([]);
          setCategories([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { products, categories, loading };
}

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { MarketplaceProduct } from "@/lib/api";

type CategoryConflict = {
  incomingProduct: MarketplaceProduct;
  currentCategoryName: string;
};

type CompareContextType = {
  selectedProducts: MarketplaceProduct[];
  selectedIds: string[];
  categorySlug: string | null;
  categoryName: string | null;
  toggleCompare: (product: MarketplaceProduct) => void;
  removeProduct: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
  setSelectedProducts: React.Dispatch<React.SetStateAction<MarketplaceProduct[]>>;
  categoryConflict: CategoryConflict | null;
  resolveCategoryConflict: (action: "switch" | "cancel") => void;
};

const STORAGE_KEY = "insurehub_compare_products_v1";

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [selectedProducts, setSelectedProducts] = useState<MarketplaceProduct[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [categoryConflict, setCategoryConflict] = useState<CategoryConflict | null>(null);

  // Load persisted comparison products on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSelectedProducts(parsed);
        }
      }
    } catch (err) {
      console.error("Failed to parse stored compare products:", err);
    } finally {
      setInitialized(true);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!initialized) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedProducts));
    } catch (err) {
      console.error("Failed to save compare products:", err);
    }
  }, [selectedProducts, initialized]);

  const selectedIds = selectedProducts.map((p) => p.id);
  const categorySlug = selectedProducts.length > 0 ? selectedProducts[0].categorySlug : null;
  const categoryName = selectedProducts.length > 0 ? selectedProducts[0].category : null;

  const isInCompare = (productId: string) => {
    return selectedProducts.some((p) => p.id === productId);
  };

  const toggleCompare = (product: MarketplaceProduct) => {
    if (isInCompare(product.id)) {
      setSelectedProducts((prev) => prev.filter((p) => p.id !== product.id));
      return;
    }

    if (selectedProducts.length >= 4) {
      alert("Comparison limit reached. You can compare up to 4 products at a time.");
      return;
    }

    // Check category consistency
    if (selectedProducts.length > 0 && selectedProducts[0].categorySlug !== product.categorySlug) {
      setCategoryConflict({
        incomingProduct: product,
        currentCategoryName: selectedProducts[0].category || "current category",
      });
      return;
    }

    setSelectedProducts((prev) => [...prev, product]);
  };

  const resolveCategoryConflict = (action: "switch" | "cancel") => {
    if (action === "switch" && categoryConflict) {
      setSelectedProducts([categoryConflict.incomingProduct]);
    }
    setCategoryConflict(null);
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const clearCompare = () => {
    setSelectedProducts([]);
  };

  return (
    <CompareContext.Provider
      value={{
        selectedProducts,
        selectedIds,
        categorySlug,
        categoryName,
        toggleCompare,
        removeProduct,
        clearCompare,
        isInCompare,
        setSelectedProducts,
        categoryConflict,
        resolveCategoryConflict,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}

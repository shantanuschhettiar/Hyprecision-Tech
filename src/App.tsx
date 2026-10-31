import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { ProductCatalog } from './components/ProductCatalog.tsx';
import { ProductComparisonModal } from './components/ProductComparisonModal.tsx';
import { AiAssistantModal } from './components/AiAssistantModal.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { RfqModal } from './components/RfqModal.tsx';
import { FormalQuotationModal } from './components/FormalQuotationModal.tsx';
import { Footer } from './components/Footer.tsx';
import { ProductItem, CategoryItem, FormalQuotationOffer } from './types.ts';
import { generateFormalQuotationOffer } from './utils/quotationDocument.ts';
import { Menu, Sparkles, Database } from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedForCompare, setSelectedForCompare] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbHealthy, setDbHealthy] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals state
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | undefined>(undefined);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [rfqModalOpen, setRfqModalOpen] = useState(false);
  const [activeRfqProduct, setActiveRfqProduct] = useState<ProductItem | null>(null);
  const [detailProduct, setDetailProduct] = useState<ProductItem | null>(null);
  const [formalOfferData, setFormalOfferData] = useState<FormalQuotationOffer | null>(null);

  // Fetch live products and categories from backend
  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
      ]);

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
        setDbHealthy(true);
      } else {
        setDbHealthy(false);
      }

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }
    } catch (err) {
      console.warn('API fetch warning, retrying on reconnect:', err);
      setDbHealthy(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Toggle compare selection
  const handleToggleCompare = (product: ProductItem) => {
    if (selectedForCompare.some((p) => p.id === product.id)) {
      setSelectedForCompare(selectedForCompare.filter((p) => p.id !== product.id));
    } else {
      if (selectedForCompare.length >= 3) {
        alert('You can compare a maximum of 3 components simultaneously.');
        return;
      }
      setSelectedForCompare([...selectedForCompare, product]);
    }
  };

  const handleOpenAi = (prompt?: string) => {
    setAiInitialPrompt(prompt || '');
    setAiAssistantOpen(true);
  };

  const handleOpenRfq = (product?: ProductItem) => {
    setActiveRfqProduct(product || null);
    setRfqModalOpen(true);
  };

  const handleOpenFormalOffer = (product: ProductItem, customData?: any) => {
    const offer = generateFormalQuotationOffer(product, customData);
    setFormalOfferData(offer);
  };

  const handleApplyAiFilter = (matchedSkus: string[]) => {
    if (!matchedSkus || matchedSkus.length === 0) return;
    setSelectedCategory('all');
  };

  const handleCompareSkus = (skus: string[]) => {
    const toCompare = products.filter((p) => skus.includes(p.sku) || skus.includes(p.id));
    if (toCompare.length >= 2) {
      setSelectedForCompare(toCompare.slice(0, 3));
      setCompareModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#111113] font-sans lg:h-screen lg:overflow-hidden flex flex-col lg:grid lg:grid-cols-[280px_1fr]">
      {/* PERSISTENT ARCHITECTURAL SIDEBAR (DESKTOP) + MOBILE DRAWER */}
      <Sidebar
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
        onOpenAi={() => handleOpenAi('')}
        onOpenAdmin={() => setAdminPanelOpen(true)}
        onOpenRfq={() => handleOpenRfq()}
        dbHealthy={dbHealthy}
        totalProducts={products.length}
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      {/* MOBILE TOP BAR (< lg) */}
      <header className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-black/10 bg-[#F8F7F4] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 text-[#111113] hover:opacity-70 border border-black/10 bg-white"
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>
          <div>
            <div className="font-editorial text-2xl font-bold leading-none">HY</div>
            <div className="mono text-[8px] text-[#111113]/60 uppercase tracking-widest">
              Precision Technology
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAi('')}
            className="px-3 py-1.5 bg-[#111113] text-white text-[11px] font-medium flex items-center gap-1.5"
            aria-label="Open Gemini Copilot"
          >
            <Sparkles size={11} className="text-[#B8860B]" />
            <span>Copilot</span>
          </button>
          <button
            onClick={() => setAdminPanelOpen(true)}
            className="p-1.5 border border-black/10 bg-white text-[#111113]"
            title="Database Console"
            aria-label="Open Admin Console"
          >
            <Database size={15} />
          </button>
        </div>
      </header>

      {/* MAIN SCROLLABLE CONTENT VIEWPORT */}
      <div className="flex-1 min-w-0 overflow-y-auto flex flex-col justify-between">
        <main className="px-6 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-14 space-y-12">
          {/* 1. ENGINEERING HERO SECTION */}
          <HeroSection
            onQuickSearch={(query) => {
              setSelectedCategory('all');
            }}
            onOpenAi={(prompt) => handleOpenAi(prompt)}
            onOpenRfq={() => handleOpenRfq()}
          />

          {/* 2. INVENTORY CATALOG WITH FILTERS & COMPARISON TRAY */}
          <ProductCatalog
            products={products}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
            selectedForCompare={selectedForCompare}
            onToggleCompare={handleToggleCompare}
            onOpenCompareModal={() => setCompareModalOpen(true)}
            onClearCompare={() => setSelectedForCompare([])}
            onViewProductDetail={(p) => setDetailProduct(p)}
            onRequestQuote={(p) => handleOpenRfq(p)}
            onViewFormalOffer={(p) => handleOpenFormalOffer(p)}
          />
        </main>

        {/* 3. FOOTER */}
        <Footer
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          onOpenAdmin={() => setAdminPanelOpen(true)}
        />
      </div>

      {/* 4. MODALS */}

      {/* Side-by-side AI Product Comparison */}
      {compareModalOpen && (
        <ProductComparisonModal
          products={selectedForCompare}
          onClose={() => setCompareModalOpen(false)}
          onRemoveProduct={(id) =>
            setSelectedForCompare(selectedForCompare.filter((p) => p.id !== id))
          }
          onRequestQuote={(p) => {
            setCompareModalOpen(false);
            handleOpenRfq(p);
          }}
        />
      )}

      {/* Gemini AI Copilot & Relational Database Manager */}
      {aiAssistantOpen && (
        <AiAssistantModal
          initialPrompt={aiInitialPrompt}
          products={products}
          onClose={() => setAiAssistantOpen(false)}
          onApplyFilter={handleApplyAiFilter}
          onCompareSkus={handleCompareSkus}
          onProductUpdated={fetchData}
        />
      )}

      {/* Admin Database & CRUD Panel */}
      {adminPanelOpen && (
        <AdminDashboard
          products={products}
          categories={categories}
          onClose={() => setAdminPanelOpen(false)}
          onRefreshData={fetchData}
          onViewFormalOffer={(p, rfq) => handleOpenFormalOffer(p, rfq)}
        />
      )}

      {/* Product Detailed Technical Specification Sheet */}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
          onToggleCompare={handleToggleCompare}
          isCompared={selectedForCompare.some((p) => p.id === detailProduct.id)}
          onRequestQuote={(p) => {
            setDetailProduct(null);
            handleOpenRfq(p);
          }}
          onViewFormalOffer={(p) => {
            setDetailProduct(null);
            handleOpenFormalOffer(p);
          }}
        />
      )}

      {/* Request For Quotation (RFQ) Submission */}
      {rfqModalOpen && (
        <RfqModal
          product={activeRfqProduct}
          onClose={() => setRfqModalOpen(false)}
          onSubmitted={fetchData}
          onViewFormalOffer={(p, customData) => {
            setRfqModalOpen(false);
            handleOpenFormalOffer(p, customData);
          }}
        />
      )}

      {/* Formal ISO 9001:2015 Techno-Commercial Quotation Offer Modal (Sample PDF Format) */}
      {formalOfferData && (
        <FormalQuotationModal
          quotation={formalOfferData}
          onClose={() => setFormalOfferData(null)}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
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
import { Bot, Sparkles } from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedForCompare, setSelectedForCompare] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbHealthy, setDbHealthy] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'catalogue' | 'compare' | 'ai' | 'commercial'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

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

        // Pre-select 2 vessels for comparison if none selected yet, so Compare badge shows 2 as in prototype photo!
        if (selectedForCompare.length === 0 && prodData.length >= 2) {
          const st80 = prodData.find((p: ProductItem) => p.sku === 'ST-80-TUG');
          const pat2380 = prodData.find((p: ProductItem) => p.sku === 'MIL-PATROL-2380');
          if (st80 && pat2380) {
            setSelectedForCompare([st80, pat2380]);
          } else {
            setSelectedForCompare([prodData[0], prodData[1]]);
          }
        }
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
        alert('You can compare a maximum of 3 vessels simultaneously.');
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

  const handleInspectFlagship = (sku: string) => {
    const target = products.find((p) => p.sku === sku || p.id === sku);
    if (target) {
      setDetailProduct(target);
    } else if (products.length > 0) {
      setDetailProduct(products[0]);
    }
  };

  const handleSearchFromHero = (query: string) => {
    setSearchQuery(query);
    const catalogElem = document.getElementById('fleet-catalogue');
    if (catalogElem) {
      catalogElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectTab = (tab: 'overview' | 'catalogue' | 'compare' | 'ai' | 'commercial') => {
    setActiveTab(tab);
    if (tab === 'overview') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'catalogue') {
      const catalogElem = document.getElementById('fleet-catalogue');
      if (catalogElem) {
        catalogElem.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (tab === 'compare') {
      setCompareModalOpen(true);
    } else if (tab === 'ai') {
      handleOpenAi('');
    } else if (tab === 'commercial') {
      if (products.length > 0) {
        const flagship = products.find((p) => p.sku === 'ST-80-TUG') || products[0];
        handleOpenFormalOffer(flagship);
      } else {
        handleOpenRfq();
      }
    }
  };

  const flagshipProduct = products.find((p) => p.sku === 'ST-80-TUG') || products[0];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950">
      {/* 1. TOP HORIZONTAL NAVBAR matching prototype photo */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        compareCount={selectedForCompare.length}
        onOpenCompare={() => setCompareModalOpen(true)}
        onOpenAi={() => handleOpenAi('')}
        onOpenRfq={() => handleOpenRfq()}
        onOpenAdmin={() => setAdminPanelOpen(true)}
        dbHealthy={dbHealthy}
        totalProducts={products.length}
      />

      {/* 2. MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* HERO SECTION matching prototype */}
        <HeroSection
          onSearch={handleSearchFromHero}
          onOpenAi={handleOpenAi}
          onOpenRfq={handleOpenRfq}
          onInspectFlagship={handleInspectFlagship}
          flagshipProduct={flagshipProduct}
        />

        {/* FULL CATALOGUE & SPECIFICATIONS VIEW */}
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
          externalSearch={searchQuery}
          onResetSearch={() => setSearchQuery('')}
        />
      </main>

      {/* 3. FOOTER */}
      <Footer
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          const catalogElem = document.getElementById('fleet-catalogue');
          if (catalogElem) catalogElem.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenAdmin={() => setAdminPanelOpen(true)}
      />

      {/* 4. FLOATING "Ask AI Assistant" BUTTON matching prototype */}
      <button
        onClick={() => handleOpenAi('')}
        className="fixed bottom-6 right-6 z-40 bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-full shadow-lg shadow-amber-500/25 hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2 transition-all cursor-pointer"
        aria-label="Ask AI Assistant"
      >
        <Bot size={17} className="text-slate-950 stroke-[2.2]" />
        <span>Ask AI Assistant</span>
      </button>

      {/* 5. MODALS */}

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

      {/* Formal ISO 9001:2015 Techno-Commercial Quotation Offer Modal */}
      {formalOfferData && (
        <FormalQuotationModal
          quotation={formalOfferData}
          onClose={() => setFormalOfferData(null)}
        />
      )}
    </div>
  );
}

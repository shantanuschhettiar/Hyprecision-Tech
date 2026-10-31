import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  CheckCircle2,
  Database,
  ArrowRight,
  Shield,
  Layers,
  RefreshCw,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { ProductItem } from '../types.ts';

interface AiAssistantModalProps {
  initialPrompt?: string;
  products: ProductItem[];
  onClose: () => void;
  onApplyFilter: (matchedSkus: string[]) => void;
  onCompareSkus: (skus: string[]) => void;
  onProductUpdated: () => void;
}

interface Message {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  matchedSkus?: string[];
  actionType?: 'ANSWER' | 'SEARCH_RESULTS' | 'EXECUTE_DB_COMMAND' | 'COMPARE_PRODUCTS' | 'INFORMATIONAL';
  executionStatus?: 'SUCCESS' | 'FAILED';
  command?: any;
  suggestedFollowUps?: string[];
  timestamp: string;
}

// Retrieve Gemini API key from environment
const GEMINI_API_KEY =
  (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
  '';

/**
 * Format markdown text (bold, bullet points, numbers) cleanly
 */
function FormattedText({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-xs leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Bullet point
        if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const bulletText = trimmed.replace(/^[•\-\*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="text-[#B8860B] font-bold mt-0.5">•</span>
              <span className="flex-1">{parseInlineFormatting(bulletText)}</span>
            </div>
          );
        }

        // Numbered list item
        const numMatch = trimmed.match(/^(\d+[\.\)])\s*(.+)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="mono text-[10px] font-bold text-[#B8860B] mt-0.5">{numMatch[1]}</span>
              <span className="flex-1">{parseInlineFormatting(numMatch[2])}</span>
            </div>
          );
        }

        // Regular paragraph or header
        return <p key={idx}>{parseInlineFormatting(trimmed)}</p>;
      })}
    </div>
  );
}

function parseInlineFormatting(str: string): React.ReactNode {
  // Split on **bold** pattern
  const parts = str.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-[#111113]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  initialPrompt = '',
  products,
  onClose,
  onApplyFilter,
  onCompareSkus,
  onProductUpdated,
}) => {
  const [userRole, setUserRole] = useState<'buyer' | 'admin'>('buyer');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-init',
      role: 'assistant',
      text: 'Welcome to the HY Precision Technology AI Engineering Assistant powered by Gemini 3.8 Flash.\n\nI am directly connected to the Gemini API and actively analyze the live inventory catalog. I can answer technical questions regarding positive displacement screw pumps, 350 Bar bladder accumulators, 5-axis aerospace titanium machining, ASME Section VIII filtration skids, cavitation prevention, or execute database updates in Admin mode.\n\nWhat engineering question or catalog inquiry can I assist you with today?',
      suggestedFollowUps: [
        'How do three-spindle screw pumps work?',
        'What is the max working pressure of your bladder accumulator?',
        'Why choose Titanium Grade 5 over SS 316L for manifolds?',
        'What quality certifications and testing do you provide?',
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState(initialPrompt);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
    }
  }, []);

  /**
   * Directly query the Gemini API to analyze the 'products' state and answer user questions
   */
  const queryGeminiDirect = async (
    query: string,
    historyPayload: Array<{ role: string; text: string }>
  ) => {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not defined in environment');
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Extract structured snapshot of the current 'products' state
    const productsSnapshot = products.map((p) => ({
      sku: p.sku,
      title: p.title,
      category: p.category_name || (p as any).category,
      price_usd: p.price_usd,
      stock_quantity: p.stock_quantity,
      lead_time_days: p.lead_time_days,
      specifications: p.specifications?.map((s) => `${s.key}: ${s.value} ${s.unit || ''}`.trim()) || [],
      certifications: p.certifications || [],
    }));

    const historyFormatted =
      historyPayload.length > 0
        ? historyPayload.map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n')
        : 'None (initial question)';

    const promptText = `You are the Lead Systems Engineering Specialist & Technical Solutions Architect at HY Precision Technology (hyprecisiontechnology.com).
Your primary duty is to ACTUALLY AND DIRECTLY ANSWER all user questions with deep engineering authority, technical precision, and practical clarity, actively grounded on the live 'products' state.

Company Background:
- Organization: HY Precision Technology
- Official Certifications: ISO 9001:2015 Quality Management & ASME Boiler & Pressure Vessel Code Section VIII Division 1.
- Partnerships: Official distributor for Euro Offshore Ltd. & Fluen Co. Korea.
- Facilities: Manufacturing Works at Renaissance Industrial Park, Thane; Engineering Office at Bhumi World, Bhiwandi, Maharashtra 421302, India.
- Direct Sales Contact: sales@hyprecisiontechnology.com, +91 70836 78003.

ACTIVE LIVE 'PRODUCTS' STATE (${products.length} Items in memory):
${JSON.stringify(productsSnapshot, null, 2)}

User Role: ${userRole}
Conversation History:
${historyFormatted}

User Message: "${query}"

CRITICAL INSTRUCTIONS:
1. DIRECTLY AND THOROUGHLY ANSWER THE USER'S QUESTION:
   - Provide a complete, highly knowledgeable answer. Explain the engineering principles, fluid dynamics, metallurgy, manufacturing tolerances, operational benefits, and practical considerations.
   - Ground your answer in the active 'products' state above. If the question relates to components in the catalog, reference them by exact SKU and title, explain their relevant specs (pressure rating, material, lead time, price, stock), and include their SKUs in "matchedSkus".
   - If the user asks general engineering questions (e.g. "How do screw pumps work?", "What is a bladder accumulator?", "Why choose Titanium over 316L?", "What is cavitation and how do you prevent it?", "Where are your facilities?"), write a thorough, well-structured answer with technical specifics and clear paragraphs or bullet points. DO NOT give a lazy 1-line response.
2. SEARCH & FILTERING INTENT:
   - If the user explicitly wants to search, filter, or recommend items (e.g. "Find pumps with pressure > 30 Bar under $2000", "Show low stock items"):
     * Set "action": "SEARCH_RESULTS"
     * Provide a clear explanation of how the matched items from the 'products' state meet the criteria.
     * Set "matchedSkus" to the matching SKU list.
3. COMPARISON INTENT:
   - If the user asks to compare 2 or 3 components from the 'products' state:
     * Set "action": "COMPARE_PRODUCTS"
     * Provide a comparative breakdown of key differences in pressure, materials, use-cases, and lead times.
     * Set "matchedSkus" to the SKUs being compared.
4. ADMIN DATABASE UPDATE INTENT:
   - If userRole === 'admin' and the prompt requests modifying a database record (e.g. "Update stock of HY-SP-40B to 25", "Set price of HY-ACC-BLD to $890"):
     * Set "action": "EXECUTE_DB_COMMAND"
     * Set "command": { "type": "UPDATE_PRODUCT", "sku": "...", "fields": { ... } }
     * Set "answer": Clear confirmation of the database transaction committed.
5. SUGGESTED FOLLOW-UPS:
   - Provide 2 to 3 concise, highly relevant follow-up questions in "suggestedFollowUps" that the user might want to ask next.

Return strictly a valid JSON object matching this schema (no markdown formatting, no backticks):
{
  "action": "ANSWER" | "SEARCH_RESULTS" | "COMPARE_PRODUCTS" | "EXECUTE_DB_COMMAND",
  "answer": "The full, articulate, highly informative answer to the question...",
  "explanation": "Same as answer",
  "matchedSkus": ["SKU-1", "SKU-2"],
  "suggestedFollowUps": ["Follow-up question 1?", "Follow-up question 2?"],
  "command": { "type": "UPDATE_PRODUCT", "sku": "...", "fields": {} }
}`;

    const geminiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), 7000)
    );

    const response = await Promise.race([geminiPromise, timeoutPromise]);
    const cleanJson = (response.text || '').replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanJson);

    if (!data.answer && data.explanation) {
      data.answer = data.explanation;
    }

    return data;
  };

  /**
   * Fallback to backend /api/ai/query-manager with full products payload
   */
  const queryBackendAssistant = async (
    query: string,
    historyPayload: Array<{ role: string; text: string }>
  ) => {
    const res = await fetch('/api/ai/query-manager', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: query,
        userRole,
        history: historyPayload,
        products: products, // Send the live products state to the backend
      }),
    });

    if (!res.ok) {
      throw new Error(`AI query failed with status: ${res.status}`);
    }

    return await res.json();
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isProcessing) return;

    const userMsg: Message = {
      id: 'm_' + Date.now(),
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
      // Pass recent conversation history so Gemini answers follow-up questions in context
      const historyPayload = messages
        .filter((m) => m.id !== 'm-init')
        .slice(-8)
        .map((m) => ({ role: m.role, text: m.text }));

      let data: any = null;

      // 1. First attempt: Direct connection to Gemini API with live products state
      try {
        data = await queryGeminiDirect(query, historyPayload);
      } catch (clientErr) {
        console.warn('Direct Gemini client query bypassed or failed, falling back to server query-manager:', clientErr);
        // 2. Second attempt: Full-stack server agent endpoint with live products state
        data = await queryBackendAssistant(query, historyPayload);
      }

      // If an admin update was requested, execute it against the database
      if (
        userRole === 'admin' &&
        data.action === 'EXECUTE_DB_COMMAND' &&
        data.command?.sku &&
        data.command?.fields
      ) {
        const targetProd = products.find((p) => p.sku === data.command.sku);
        if (targetProd) {
          try {
            await fetch(`/api/products/${targetProd.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data.command.fields),
            });
            data.executionStatus = 'SUCCESS';
            onProductUpdated();
          } catch (dbErr) {
            console.error('Failed to commit DB update:', dbErr);
          }
        }
      }

      const botMsg: Message = {
        id: 'bot_' + Date.now(),
        role: 'assistant',
        text: data.answer || data.explanation || 'Question answered.',
        matchedSkus: data.matchedSkus,
        actionType: data.action,
        executionStatus: data.executionStatus,
        command: data.command,
        suggestedFollowUps: data.suggestedFollowUps,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('AI assistant processing error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          text: 'Encountered an issue communicating with the Gemini engineering agent. Please try again or rephrase your question.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const samplePrompts =
    userRole === 'buyer'
      ? [
          'How do three-spindle screw pumps work?',
          'What is the max pressure of your bladder accumulator?',
          'Why choose Titanium Grade 5 over SS 316L?',
          'What is cavitation and how do you prevent it?',
          'Where are your manufacturing facilities located?',
          'Find screw pumps with pressure over 30 Bar under $2000',
        ]
      : [
          'Update stock of HY-SP-40B to 25 units',
          'Set price of HY-ACC-BLD to $890',
          'Find all components with stock <= 5',
          'List available hydraulic pump SKUs',
        ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-[#F8F7F4] max-w-3xl w-full h-[680px] max-h-[94vh] flex flex-col shadow-2xl border border-black/15 overflow-hidden text-[#111113]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#111113] text-white flex justify-between items-center shrink-0 border-b border-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 text-[#B8860B] border border-white/10">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-editorial text-xl sm:text-2xl font-bold tracking-tight">
                  Gemini Engineering Q&A & DB Agent
                </h3>
                <span className="mono text-[9px] text-[#B8860B] border border-[#B8860B]/40 px-1.5 py-0.5">
                  GEMINI 3.8 FLASH
                </span>
              </div>
              <p className="mono text-[10px] text-white/50 tracking-wider">
                Direct answers to engineering, metallurgy, cavitation & relational catalog queries
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white transition"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Selector Strip */}
        <div className="bg-white px-5 py-2.5 border-b border-black/10 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="mono text-[10px] text-[#111113]/60 uppercase font-semibold">
              Mode:
            </span>
            <button
              onClick={() => setUserRole('buyer')}
              className={`px-3 py-1 text-xs mono uppercase tracking-wider transition cursor-pointer border ${
                userRole === 'buyer'
                  ? 'bg-[#111113] text-white border-[#111113] font-bold'
                  : 'bg-transparent text-[#111113]/70 border-black/10 hover:border-black/30'
              }`}
            >
              Buyer / Engineering Q&A
            </button>
            <button
              onClick={() => setUserRole('admin')}
              className={`px-3 py-1 text-xs mono uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer border ${
                userRole === 'admin'
                  ? 'bg-[#B8860B] text-white border-[#B8860B] font-bold'
                  : 'bg-transparent text-[#111113]/70 border-black/10 hover:border-black/30'
              }`}
            >
              <Database size={11} />
              <span>Admin / DB Manager</span>
            </button>
          </div>

          <span className="hidden sm:inline mono text-[10px] text-[#111113]/50">
            {products.length} catalog items grounded in SQLite
          </span>
        </div>

        {/* Message Thread */}
        <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto space-y-5 bg-[#F8F7F4] text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 bg-[#111113] text-[#B8860B] flex items-center justify-center shrink-0 border border-black/10 mt-1">
                  <Bot size={16} />
                </div>
              )}

              <div
                className={`max-w-[88%] p-4 space-y-3 shadow-xs ${
                  m.role === 'user'
                    ? 'bg-[#111113] text-white'
                    : 'bg-white border border-black/10 text-[#111113]'
                }`}
              >
                {/* Formatted Message Body */}
                <FormattedText content={m.text} />

                {/* Successful DB Execution Badge */}
                {m.executionStatus === 'SUCCESS' && (
                  <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-2 mono text-[11px]">
                    <CheckCircle2 size={13} className="text-emerald-700 shrink-0" />
                    <span>Relational database transaction committed to SQLite storage.</span>
                  </div>
                )}

                {/* Matched SKUs Action Bar */}
                {m.matchedSkus && m.matchedSkus.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-black/10 flex flex-wrap items-center gap-2">
                    <span className="mono text-[9px] text-[#111113]/60 uppercase font-bold mr-1">
                      Related:
                    </span>
                    <button
                      onClick={() => {
                        onApplyFilter(m.matchedSkus!);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-[#111113] hover:bg-[#B8860B] text-white text-[10px] mono uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Layers size={11} />
                      <span>Filter Catalog ({m.matchedSkus.length})</span>
                    </button>

                    {m.matchedSkus.length >= 2 && (
                      <button
                        onClick={() => {
                          onCompareSkus(m.matchedSkus!.slice(0, 3));
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-black/5 text-[#111113] border border-black/20 text-[10px] mono uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Sparkles size={11} className="text-[#B8860B]" />
                        <span>Compare Side-by-Side</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Suggested Follow-Up Questions */}
                {m.suggestedFollowUps && m.suggestedFollowUps.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-black/10 space-y-1.5">
                    <div className="mono text-[9px] text-[#B8860B] font-bold uppercase flex items-center gap-1">
                      <HelpCircle size={10} /> Suggested Follow-ups:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.suggestedFollowUps.map((q, qIdx) => (
                        <button
                          key={qIdx}
                          onClick={() => handleSend(q)}
                          className="text-[11px] px-2.5 py-1 bg-[#F8F7F4] hover:bg-[#111113] hover:text-white border border-black/10 text-[#111113] transition text-left cursor-pointer"
                        >
                          "{q}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  className={`mono text-[9px] text-right pt-1 ${
                    m.role === 'user' ? 'text-white/50' : 'text-[#111113]/40'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>

              {m.role === 'user' && (
                <div className="w-8 h-8 bg-[#B8860B] text-white flex items-center justify-center shrink-0 font-bold mt-1">
                  <User size={15} />
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-2 text-[#111113]/70 mono text-[11px] italic pl-11">
              <RefreshCw size={13} className="animate-spin text-[#B8860B]" />
              <span>Gemini 3.8 Flash is analyzing engineering principles and live database...</span>
            </div>
          )}
        </div>

        {/* Suggestion Question Chips */}
        <div className="p-3 bg-white border-t border-black/10 shrink-0">
          <div className="mono text-[9px] font-bold text-[#111113]/60 uppercase mb-1.5">
            Ask an engineering or inventory question:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {samplePrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p)}
                className="mono text-[10px] px-2.5 py-1 bg-[#F8F7F4] hover:bg-[#111113] hover:text-white border border-black/10 text-[#111113] transition text-left cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-white border-t border-black/10 flex gap-2 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              userRole === 'buyer'
                ? 'Ask any question: "How do screw pumps work?", "What is cavitation?", "Compare specs"...'
                : 'Admin command: "Update stock of HY-SP-40B to 30", "Change price of HY-ACC-BLD to $890"...'
            }
            className="flex-1 px-4 py-2.5 border border-black/15 text-xs sm:text-sm text-[#111113] focus:outline-none focus:border-[#B8860B] bg-[#F8F7F4]"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isProcessing}
            className={`px-6 py-2.5 text-xs mono uppercase tracking-wider font-bold flex items-center gap-1.5 transition cursor-pointer ${
              input.trim() && !isProcessing
                ? 'bg-[#111113] hover:bg-[#B8860B] text-white shadow-xs'
                : 'bg-black/10 text-black/30 cursor-not-allowed'
            }`}
          >
            <span>Send</span>
            <Send size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

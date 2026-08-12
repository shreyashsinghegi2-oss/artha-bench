import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleStop,
  Clipboard,
  Download,
  ExternalLink,
  History,
  Languages,
  Loader2,
  Menu,
  MessageCircleQuestion,
  PanelRight,
  Plus,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { BentoCard } from '../components/BentoCard';
import { TUTOR_QUESTION_CATEGORIES } from '../data/tutorQuestions';
import {
  CountryCode,
  CurrencyCode,
  GroqConnectionStatus,
  SavedTutorConversation,
  TutorChatInput,
  TutorChatResponse,
  TutorDetail,
  TutorLanguage,
  TutorLevel,
  TutorMode,
} from '../types';

interface TutorPageProps {
  connectionStatus?: GroqConnectionStatus;
  initialQuestion?: string;
  onInitialQuestionConsumed?: () => void;
  demoMode: boolean;
}

interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  response?: TutorChatResponse;
  demo?: boolean;
}

const SAVED_KEY = 'artha_bench_tutor_saved_conversations';
const LEGACY_SAVED_KEY = 'fintrust_tutor_saved_conversations';
const loadingStages = ['Connecting to Groq', 'Understanding question', 'Running verified calculation', 'Checking current sources', 'Reviewing answer'];

function safeLoadConversations(): SavedTutorConversation[] {
  try {
    const value = localStorage.getItem(SAVED_KEY) || localStorage.getItem(LEGACY_SAVED_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 20) : [];
  } catch {
    return [];
  }
}

function providerErrorMessage(state?: string, fallback?: string) {
  const messages: Record<string, string> = {
    not_configured: 'Groq secret is not configured. Add GROQ_API_KEY in Settings → Secrets.',
    invalid_credentials: 'Groq rejected the server credential. Rotate the key and update the secret.',
    rate_limited: 'Groq rate limit reached. Wait briefly and retry.',
    invalid_request: 'The provider rejected the request format. Review the question and retry.',
    invalid_response: 'Groq returned an invalid structured response. Retry with the request ID below.',
    timeout: 'Groq did not respond before the timeout.',
    model_unavailable: 'The configured model is not available to this Groq project.',
    provider_unavailable: 'Groq is temporarily unavailable. Retry shortly.',
  };
  return (state && messages[state]) || fallback || 'The tutor request could not be completed.';
}

function demoLesson(question: string): TutorChatResponse {
  return {
    conversationId: `demo_${Date.now()}`,
    answer: {
      title: 'Demo lesson: financial learning framework',
      directExplanation: `This offline demo shows how the tutor structures a lesson about “${question}”. Live Groq is not being used.`,
      keyConcepts: ['Define the concept', 'State assumptions', 'Use verified calculations', 'Discuss risks and limitations'],
      steps: ['Identify the financial concept.', 'Separate facts from assumptions.', 'Calculate with the deterministic engine when inputs are available.', 'Check understanding with a follow-up question.'],
      formula: '',
      workedExample: 'Connect Groq to receive a question-specific worked example.',
      commonMistakes: ['Treating an educational example as a personal recommendation.'],
      riskAndLimitations: ['Demo content is a local fixture and is not generated or reviewed by Groq.'],
      knowledgeCheck: 'Which assumption would most change the result in your example?',
      suggestedFollowUps: ['What information is needed for a verified calculation?', 'How do I distinguish education from advice?'],
      educationalDisclaimer: 'Educational information only; not financial, legal or tax advice.',
    },
    calculation: {
      used: false,
      formulaName: '',
      inputs: { principal: null, annualRatePercent: null, years: null, paymentsPerYear: null, payment: null, income: null, debt: null, expenses: null },
      result: null,
      formattedResult: '',
      verified: false,
      formula: '',
      substitution: '',
      interpretation: '',
      limitations: '',
    },
    evidence: { used: false, sources: [], summary: '' },
    review: { usedSecondaryModel: false, status: 'passed', warnings: ['Offline demo — no model review was performed.'] },
    provider: { name: 'Groq', model: 'Offline demo fixture', latencyMs: 0, requestId: 'demo' },
  };
}

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">{children}</label>
);

export const TutorPage: React.FC<TutorPageProps> = ({
  connectionStatus,
  initialQuestion,
  onInitialQuestionConsumed,
  demoMode,
}) => {
  const [question, setQuestion] = useState('');
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [country, setCountry] = useState<CountryCode>('GLOBAL');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [language, setLanguage] = useState<TutorLanguage>('English');
  const [level, setLevel] = useState<TutorLevel>('Beginner');
  const [mode, setMode] = useState<TutorMode>('Explain');
  const [detail, setDetail] = useState<TutorDetail>('Detailed');
  const [useSources, setUseSources] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(loadingStages[0]);
  const [error, setError] = useState<{ message: string; requestId?: string } | null>(null);
  const [savedConversations, setSavedConversations] = useState<SavedTutorConversation[]>(safeLoadConversations);
  const [openCategory, setOpenCategory] = useState('budgeting');
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialQuestion) {
      setQuestion(initialQuestion);
      onInitialQuestionConsumed?.();
    }
  }, [initialQuestion, onInitialQuestionConsumed]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [turns, loading, reducedMotion]);

  const inputContext = useMemo(() => ({ country, currency, language, level, mode, detail, useSources }), [country, currency, language, level, mode, detail, useSources]);

  const resetChat = () => {
    abortRef.current?.abort();
    setTurns([]);
    setConversationId(null);
    setQuestion('');
    setError(null);
    setLoading(false);
  };

  const sendQuestion = async (override?: string, forceDemo = false) => {
    const message = (override ?? question).trim();
    if (!message || loading) return;
    const userTurn: ChatTurn = { id: `user_${Date.now()}`, role: 'user', content: message };
    const priorTurns = [...turns, userTurn];
    setTurns(priorTurns);
    setQuestion('');
    setError(null);

    if (demoMode || forceDemo) {
      const response = demoLesson(message);
      setConversationId(response.conversationId);
      setTurns((current) => [...current, { id: `assistant_${Date.now()}`, role: 'assistant', content: response.answer.directExplanation, response, demo: true }]);
      return;
    }

    setLoading(true);
    setLoadingStage(loadingStages[0]);
    let stageIndex = 0;
    const stageTimer = window.setInterval(() => {
      stageIndex = Math.min(stageIndex + 1, loadingStages.length - 1);
      setLoadingStage(loadingStages[stageIndex]);
    }, 900);
    const controller = new AbortController();
    abortRef.current = controller;

    const payload: TutorChatInput = {
      message,
      conversationId,
      history: turns.slice(-12).map((turn) => ({ role: turn.role, content: turn.content })),
      ...inputContext,
    };

    try {
      const response = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw Object.assign(new Error(data?.error?.message || 'Tutor request failed.'), {
          state: data?.error?.state,
          requestId: data?.error?.requestId,
        });
      }
      const result = data as TutorChatResponse;
      setConversationId(result.conversationId);
      setTurns((current) => [...current, {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: `${result.answer.title}\n${result.answer.directExplanation}`,
        response: result,
      }]);
    } catch (caught: any) {
      if (caught?.name !== 'AbortError') {
        setError({ message: providerErrorMessage(caught?.state, caught?.message), requestId: caught?.requestId });
      }
    } finally {
      window.clearInterval(stageTimer);
      abortRef.current = null;
      setLoading(false);
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setLoading(false);
    setError({ message: 'Request stopped. You can edit the question and try again.' });
  };

  const saveConversation = () => {
    if (!turns.length) return;
    const id = conversationId || `saved_${Date.now()}`;
    const firstQuestion = turns.find((turn) => turn.role === 'user')?.content || 'Financial learning conversation';
    const existing = savedConversations.find((item) => item.id === id);
    const saved: SavedTutorConversation = {
      id,
      title: firstQuestion.replace(/[0-9₹$£€][0-9,.-]*/g, '…').slice(0, 70),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      context: inputContext,
      turns: turns.map(({ role, content }) => ({ role, content })),
    };
    const next = [saved, ...savedConversations.filter((item) => item.id !== id)].slice(0, 20);
    setSavedConversations(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  };

  const loadConversation = (saved: SavedTutorConversation) => {
    setConversationId(saved.id);
    setCountry(saved.context.country);
    setCurrency(saved.context.currency);
    setLanguage(saved.context.language);
    setLevel(saved.context.level);
    setMode(saved.context.mode);
    setDetail(saved.context.detail);
    setUseSources(saved.context.useSources);
    setTurns(saved.turns.map((turn, index) => ({ ...turn, id: `${saved.id}_${index}` })));
    setCategoriesOpen(false);
  };

  const deleteSaved = (id: string) => {
    const next = savedConversations.filter((saved) => saved.id !== id);
    setSavedConversations(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  };

  const clearSaved = () => {
    if (!confirm('Clear all saved tutor conversations from this browser?')) return;
    setSavedConversations([]);
    localStorage.removeItem(SAVED_KEY);
    localStorage.removeItem(LEGACY_SAVED_KEY);
  };

  const exportNotes = () => {
    if (!turns.length) return;
    const text = turns.map((turn) => `${turn.role === 'user' ? 'LEARNER' : 'ARTHA TUTOR'}\n${turn.content}`).join('\n\n');
    const blob = new Blob([`Artha Bench Learning Notes\nExported ${new Date().toLocaleString()}\n\n${text}\n\nEducational information only; not financial advice.`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'artha-bench-learning-notes.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const copyAnswer = async (response: TutorChatResponse) => {
    const value = [response.answer.title, response.answer.directExplanation, ...response.answer.steps, response.answer.workedExample].filter(Boolean).join('\n\n');
    await navigator.clipboard.writeText(value);
  };

  const categoryPanel = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Learning library</h2>
        <button onClick={() => setCategoriesOpen(false)} className="lg:hidden text-zinc-400" aria-label="Close learning library"><X className="w-4 h-4" /></button>
      </div>
      <div className="space-y-1.5 max-h-[45vh] overflow-y-auto pr-1">
        {TUTOR_QUESTION_CATEGORIES.map((category) => (
          <div key={category.id}>
            <button
              onClick={() => setOpenCategory(openCategory === category.id ? '' : category.id)}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
              aria-expanded={openCategory === category.id}
            >
              <span>{category.label}</span>
              {openCategory === category.id ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {openCategory === category.id && (
              <div className="pl-2 py-1 space-y-1">
                {category.questions.map((item) => (
                  <button key={item} onClick={() => { setQuestion(item); setCategoriesOpen(false); }} className="w-full rounded-lg px-3 py-2 text-left text-[11px] leading-relaxed text-zinc-500 hover:bg-indigo-500/10 hover:text-indigo-300">
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="border-t border-zinc-800 pt-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Saved</h2>
          {savedConversations.length > 0 && <button onClick={clearSaved} className="text-[10px] text-rose-400 hover:text-rose-300">Clear all</button>}
        </div>
        <div className="space-y-1 max-h-44 overflow-y-auto">
          {savedConversations.length === 0 && <p className="text-[11px] text-zinc-600">Save is optional. Nothing is stored until you choose Save.</p>}
          {savedConversations.map((saved) => (
            <div key={saved.id} className="group flex items-center gap-1 rounded-xl hover:bg-zinc-800/70">
              <button onClick={() => loadConversation(saved)} className="flex-1 min-w-0 px-2.5 py-2 text-left text-[11px] text-zinc-400 truncate">{saved.title}</button>
              <button onClick={() => deleteSaved(saved.id)} className="p-2 text-zinc-600 hover:text-rose-400" aria-label={`Delete ${saved.title}`}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const contextPanel = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Learning context</h2>
        <button onClick={() => setContextOpen(false)} className="lg:hidden text-zinc-400" aria-label="Close learning context"><X className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><FieldLabel>Country</FieldLabel><select value={country} onChange={(event) => setCountry(event.target.value as CountryCode)} className="tutor-select"><option value="GLOBAL">Global</option><option value="IN">India</option><option value="US">United States</option><option value="UK">United Kingdom</option><option value="EU">European Union</option><option value="CA">Canada</option><option value="AU">Australia</option><option value="SG">Singapore</option><option value="JP">Japan</option></select></div>
        <div><FieldLabel>Currency</FieldLabel><select value={currency} onChange={(event) => setCurrency(event.target.value as CurrencyCode)} className="tutor-select"><option>USD</option><option>INR</option><option>GBP</option><option>EUR</option><option>CAD</option><option>AUD</option><option>SGD</option><option>JPY</option></select></div>
      </div>
      <div><FieldLabel>Language</FieldLabel><select value={language} onChange={(event) => setLanguage(event.target.value as TutorLanguage)} className="tutor-select"><option>English</option><option>Hindi</option><option>Hinglish</option></select></div>
      <div><FieldLabel>Level</FieldLabel><select value={level} onChange={(event) => setLevel(event.target.value as TutorLevel)} className="tutor-select"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div>
      <div><FieldLabel>Learning mode</FieldLabel><select value={mode} onChange={(event) => setMode(event.target.value as TutorMode)} className="tutor-select"><option>Explain</option><option>Step-by-step</option><option>Socratic tutor</option><option>Quiz</option><option>Calculator lesson</option><option>Compare concepts</option></select></div>
      <div><FieldLabel>Response detail</FieldLabel><div className="grid grid-cols-2 gap-2">{(['Short', 'Detailed'] as TutorDetail[]).map((item) => <button key={item} onClick={() => setDetail(item)} className={`rounded-xl border px-3 py-2 text-xs ${detail === item ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300' : 'border-zinc-800 text-zinc-500'}`}>{item}</button>)}</div></div>
      <label className="flex items-center justify-between gap-3 text-xs text-zinc-400"><span>Use official sources when current</span><input type="checkbox" checked={useSources} onChange={(event) => setUseSources(event.target.checked)} className="accent-indigo-500" /></label>
      <label className="flex items-center justify-between gap-3 text-xs text-zinc-400"><span>High contrast</span><input type="checkbox" checked={highContrast} onChange={(event) => setHighContrast(event.target.checked)} className="accent-indigo-500" /></label>
      <label className="flex items-center justify-between gap-3 text-xs text-zinc-400"><span>Reduced motion</span><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} className="accent-indigo-500" /></label>
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-amber-200/80">
        Never share card numbers, OTPs, passwords, tax IDs, private keys or API keys.
      </div>
    </div>
  );

  return (
    <div className={`${highContrast ? 'contrast-125' : ''} ${reducedMotion ? '[&_*]:!transition-none' : ''} space-y-5`}>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2"><MessageCircleQuestion className="w-6 h-6 text-indigo-400" /> Artha Financial Tutor</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-bold text-amber-300">Educational only</span>
            <span className={`rounded-full border px-2.5 py-1 font-semibold ${connectionStatus?.verified ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400'}`}>
              {connectionStatus?.verified ? 'Groq verified' : connectionStatus ? connectionStatus.state.replaceAll('_', ' ') : 'Checking Groq'}
            </span>
            {(demoMode || turns.some((turn) => turn.demo)) && <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 font-bold text-sky-300">Offline demo</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCategoriesOpen(true)} className="lg:hidden tutor-toolbar-button"><Menu className="w-4 h-4" /> Library</button>
          <button onClick={() => setContextOpen(true)} className="lg:hidden tutor-toolbar-button"><PanelRight className="w-4 h-4" /> Context</button>
          <button onClick={resetChat} className="tutor-toolbar-button"><Plus className="w-4 h-4" /> New Chat</button>
          <button onClick={() => { setTurns([]); setError(null); }} disabled={!turns.length} className="tutor-toolbar-button disabled:opacity-40"><Trash2 className="w-4 h-4" /> Clear Chat</button>
          <button onClick={saveConversation} disabled={!turns.length} className="tutor-toolbar-button disabled:opacity-40"><Save className="w-4 h-4" /> Save</button>
          <button onClick={exportNotes} disabled={!turns.length} className="tutor-toolbar-button disabled:opacity-40"><Download className="w-4 h-4" /> Export Notes</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)_270px] gap-5 items-start">
        <BentoCard className="hidden lg:block sticky top-24 max-h-[calc(100vh-7rem)] overflow-hidden">{categoryPanel}</BentoCard>

        <section className="min-w-0 space-y-4" aria-label="Financial tutor conversation">
          <BentoCard className="min-h-[55vh] max-h-[68vh] overflow-y-auto p-4 sm:p-6" aria-live="polite">
            {turns.length === 0 && !loading ? (
              <div className="min-h-[48vh] flex flex-col items-center justify-center text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center"><Sparkles className="w-7 h-7 text-indigo-300" /></div>
                <h2 className="text-xl font-bold text-white mt-5">Learn finance by asking any question</h2>
                <p className="text-sm text-zinc-400 max-w-lg mt-2 leading-relaxed">Choose a lesson from the library or type your own question. Numerical lessons use the deterministic engine; high-risk or current topics receive independent review.</p>
                <div className="flex flex-wrap justify-center gap-2 mt-5">
                  {['What is compound interest?', 'How is loan EMI calculated?', 'Give me a beginner budgeting quiz.'].map((item) => <button key={item} onClick={() => setQuestion(item)} className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-400 hover:border-indigo-500/50 hover:text-indigo-300">{item}</button>)}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {turns.map((turn) => turn.role === 'user' ? (
                  <div key={turn.id} className="flex justify-end"><div className="max-w-[85%] rounded-2xl rounded-br-md bg-indigo-600 px-4 py-3 text-sm leading-relaxed text-white">{turn.content}</div></div>
                ) : turn.response ? (
                  <TutorResponseCard key={turn.id} response={turn.response} demo={turn.demo} onCopy={copyAnswer} onFollowUp={setQuestion} />
                ) : null)}
                {loading && <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/5 p-4 flex items-center gap-3"><Loader2 className="w-5 h-5 animate-spin text-indigo-400" /><div><p className="text-xs font-bold text-indigo-300">{loadingStage}</p><p className="text-[11px] text-zinc-500 mt-0.5">The request will stop automatically if the provider timeout is reached.</p></div></div>}
                <div ref={endRef} />
              </div>
            )}
          </BentoCard>

          {error && (
            <BentoCard className="border-rose-500/35 bg-rose-950/15 p-4">
              <div className="flex items-start gap-3"><AlertTriangle className="w-5 h-5 text-rose-400 mt-0.5" /><div className="flex-1"><p className="text-sm font-bold text-rose-300">Tutor request needs attention</p><p className="text-xs text-zinc-300 mt-1">{error.message}</p>{error.requestId && <p className="text-[10px] font-mono text-zinc-600 mt-2">Request ID: {error.requestId}</p>}<div className="flex flex-wrap gap-2 mt-3"><button onClick={() => sendQuestion(turns.filter((turn) => turn.role === 'user').at(-1)?.content)} className="tutor-toolbar-button"><RotateCcw className="w-3.5 h-3.5" /> Retry</button><button onClick={() => { setQuestion(turns.filter((turn) => turn.role === 'user').at(-1)?.content || ''); setError(null); }} className="tutor-toolbar-button">Edit Question</button><button onClick={() => sendQuestion(turns.filter((turn) => turn.role === 'user').at(-1)?.content, true)} className="tutor-toolbar-button">Use Offline Demo</button></div></div></div>
            </BentoCard>
          )}

          <BentoCard className="p-3 sm:p-4">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value.slice(0, 6000))}
              onKeyDown={(event) => { if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) sendQuestion(); }}
              rows={3}
              maxLength={6000}
              className="w-full resize-none bg-transparent px-2 py-1 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
              placeholder="Ask any finance-learning question… (Ctrl/Cmd + Enter to send)"
              aria-label="Financial tutor question"
            />
            <div className="flex items-center justify-between gap-3 border-t border-zinc-800 pt-3 mt-2">
              <span className="text-[10px] text-zinc-600">{question.length.toLocaleString()} / 6,000</span>
              {loading ? <button onClick={stop} className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white"><CircleStop className="w-4 h-4" /> Stop</button> : <button onClick={() => sendQuestion()} disabled={!question.trim()} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-40"><Send className="w-4 h-4" /> Send</button>}
            </div>
          </BentoCard>
          <p className="text-center text-[10px] text-zinc-600">Educational information, not financial advice. Verify important decisions with an appropriately licensed professional.</p>
        </section>

        <BentoCard className="hidden lg:block sticky top-24">{contextPanel}</BentoCard>
      </div>

      {categoriesOpen && <div className="fixed inset-0 z-[70] bg-black/70 lg:hidden" onClick={() => setCategoriesOpen(false)}><div className="h-full w-[88%] max-w-sm bg-zinc-950 border-r border-zinc-800 p-5 overflow-y-auto" onClick={(event) => event.stopPropagation()}>{categoryPanel}</div></div>}
      {contextOpen && <div className="fixed inset-0 z-[70] bg-black/70 lg:hidden flex justify-end" onClick={() => setContextOpen(false)}><div className="h-full w-[88%] max-w-sm bg-zinc-950 border-l border-zinc-800 p-5 overflow-y-auto" onClick={(event) => event.stopPropagation()}>{contextPanel}</div></div>}
    </div>
  );
};

const TutorResponseCard: React.FC<{
  response: TutorChatResponse;
  demo?: boolean;
  onCopy: (response: TutorChatResponse) => void;
  onFollowUp: (question: string) => void;
}> = ({ response, demo, onCopy, onFollowUp }) => {
  const { answer, calculation, evidence, review, provider } = response;
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-zinc-800 px-4 py-3">
        <div><div className="flex flex-wrap items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-400" /><h3 className="font-bold text-white">{answer.title}</h3>{demo && <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-sky-300">Offline demo</span>}</div><p className="text-[10px] text-zinc-600 mt-1">{provider.model} · {provider.latencyMs} ms</p></div>
        <button onClick={() => onCopy(response)} className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-white" aria-label="Copy tutor answer"><Clipboard className="w-4 h-4" /></button>
      </div>
      <div className="space-y-5 p-4 sm:p-5">
        <p className="text-sm leading-7 text-zinc-200 whitespace-pre-wrap">{answer.directExplanation}</p>
        {answer.keyConcepts.length > 0 && <section><h4 className="tutor-section-title"><BookOpen className="w-4 h-4" /> Key concepts</h4><div className="flex flex-wrap gap-2 mt-2">{answer.keyConcepts.map((item) => <span key={item} className="rounded-full border border-indigo-500/20 bg-indigo-500/5 px-3 py-1.5 text-[11px] text-indigo-200">{item}</span>)}</div></section>}
        {answer.steps.length > 0 && <section><h4 className="tutor-section-title"><CheckCircle2 className="w-4 h-4" /> Step by step</h4><ol className="mt-2 space-y-2">{answer.steps.map((step, index) => <li key={`${index}-${step}`} className="flex gap-3 text-xs leading-6 text-zinc-300"><span className="w-5 h-5 flex-shrink-0 rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400 flex items-center justify-center mt-0.5">{index + 1}</span><span>{step}</span></li>)}</ol></section>}
        {answer.formula && <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4"><h4 className="text-xs font-bold text-cyan-300 flex items-center gap-2"><Calculator className="w-4 h-4" /> Formula</h4><p className="font-mono text-sm text-cyan-100 mt-2 break-words">{answer.formula}</p></section>}
        {calculation.used && <section className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4"><div className="flex items-center justify-between gap-2"><h4 className="text-xs font-bold text-emerald-300 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Verified calculation</h4><span className="text-[9px] uppercase font-bold text-emerald-400">Deterministic</span></div><p className="text-sm font-bold text-white mt-3">{calculation.formattedResult}</p><p className="font-mono text-[11px] leading-5 text-zinc-400 mt-2">{calculation.substitution}</p><p className="text-xs leading-5 text-zinc-300 mt-2">{calculation.interpretation}</p></section>}
        {answer.workedExample && !calculation.used && <section><h4 className="tutor-section-title"><Calculator className="w-4 h-4" /> Worked example</h4><p className="mt-2 text-xs leading-6 text-zinc-300 whitespace-pre-wrap">{answer.workedExample}</p></section>}
        {(answer.commonMistakes.length > 0 || answer.riskAndLimitations.length > 0) && <div className="grid sm:grid-cols-2 gap-3">{answer.commonMistakes.length > 0 && <section className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-3"><h4 className="text-[11px] font-bold text-amber-300">Common mistakes</h4><ul className="mt-2 list-disc pl-4 text-[11px] leading-5 text-zinc-400">{answer.commonMistakes.map((item) => <li key={item}>{item}</li>)}</ul></section>}{answer.riskAndLimitations.length > 0 && <section className="rounded-xl border border-rose-500/15 bg-rose-500/5 p-3"><h4 className="text-[11px] font-bold text-rose-300">Risks & limitations</h4><ul className="mt-2 list-disc pl-4 text-[11px] leading-5 text-zinc-400">{answer.riskAndLimitations.map((item) => <li key={item}>{item}</li>)}</ul></section>}</div>}
        {evidence.used && <section><h4 className="tutor-section-title"><ExternalLink className="w-4 h-4" /> Official sources</h4><div className="mt-2 space-y-2">{evidence.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-zinc-800 p-3 hover:border-indigo-500/40"><span className="text-xs font-semibold text-indigo-300">{source.title}</span><span className="block text-[10px] text-zinc-600 mt-1">{source.authorityDomain}{source.effectiveDate ? ` · ${source.effectiveDate}` : ''}</span></a>)}</div></section>}
        {answer.knowledgeCheck && <section className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4"><h4 className="text-xs font-bold text-violet-300 flex items-center gap-2"><MessageCircleQuestion className="w-4 h-4" /> Knowledge check</h4><p className="text-xs leading-6 text-zinc-300 mt-2">{answer.knowledgeCheck}</p></section>}
        {answer.suggestedFollowUps.length > 0 && <div className="flex flex-wrap gap-2">{answer.suggestedFollowUps.map((item) => <button key={item} onClick={() => onFollowUp(item)} className="rounded-full border border-zinc-800 px-3 py-1.5 text-[11px] text-zinc-400 hover:border-indigo-500/40 hover:text-indigo-300">{item}</button>)}</div>}
        <div className="border-t border-zinc-800 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"><p className="text-[10px] text-zinc-600">{answer.educationalDisclaimer}</p><span className={`text-[9px] font-bold uppercase ${review.status === 'blocked' ? 'text-rose-400' : review.status === 'corrected' ? 'text-amber-400' : 'text-emerald-400'}`}>{review.usedSecondaryModel ? `Independent review: ${review.status}` : 'Primary tutor response'}</span></div>
      </div>
    </article>
  );
};

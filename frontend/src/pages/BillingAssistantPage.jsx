import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import {
  Bot,
  Send,
  User,
  Sparkles,
  ArrowRight,
  Clock,
  ShieldCheck,
  CreditCard,
  Repeat,
  Receipt,
  HelpCircle
} from 'lucide-react';

export const BillingAssistantPage = ({ setActiveTab, onOpenSwitchPlan, onOpenPayInvoice }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef(null);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/assistant/history');
      if (res.success && res.messages) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query || !query.trim()) return;

    setInputText('');

    // Optimistically add user message
    const tempUserMsg = {
      sender: 'user',
      text: query,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      setSending(true);
      const res = await api.post('/assistant/chat', { message: query });
      if (res.success && res.reply) {
        setMessages(prev => [...prev, res.reply]);
      }
    } catch (err) {
      const errorMsg = {
        sender: 'assistant',
        text: `⚠️ I encountered an error checking your billing records: ${err.message}. Please try again shortly.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const samplePrompts = [
    'Why is my invoice higher this month?',
    'When is my next renewal?',
    'How much do I owe?',
    'What subscriptions do I currently have?',
    'What is included in my plan?',
    'Can I switch to a cheaper plan?'
  ];

  const handleQuickAction = (action) => {
    if (!action) return;

    if (action.actionType === 'query_due') {
      handleSendMessage('How much do I owe?');
    } else if (action.actionType === 'query_renewal') {
      handleSendMessage('When is my next renewal?');
    } else if (action.actionType === 'query_subscriptions') {
      handleSendMessage('What subscriptions do I currently have?');
    } else if (action.actionType === 'query_cheaper_plans') {
      handleSendMessage('Can I switch to a cheaper plan?');
    } else if (action.actionType === 'browse_plans') {
      setActiveTab('compare-plans');
    } else if (action.actionType === 'switch_plan') {
      setActiveTab('subscriptions');
    } else if (action.actionType === 'view_invoice') {
      setActiveTab('invoices');
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              Brightloop Billing Assistant
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Customer Data
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Deterministic calculations & financial breakdowns for <strong>{user?.customer?.companyName || user?.name}</strong>
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Strict Customer Data Isolation</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-400">
            Connecting to your billing records...
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={index}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-slate-900 text-white'
                      : 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-xl space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-slate-900 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200/80 shadow-sm rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Quick Action Chips attached to assistant reply */}
                  {!isUser && msg.metadata?.quickActions && msg.metadata.quickActions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.metadata.quickActions.map((act, i) => (
                        <button
                          key={i}
                          onClick={() => handleQuickAction(act)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 transition-all flex items-center gap-1"
                        >
                          <span>{act.label}</span>
                          <ArrowRight className="w-3 h-3 text-brand-500" />
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 block px-1">
                    {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {sending && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 rounded-tl-none flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
              Checking your subscription records & calculating figures...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="p-3 bg-white border-t border-slate-100 overflow-x-auto flex items-center gap-2 no-scrollbar">
        <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" /> Ask:
        </span>
        {samplePrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(p)}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Message Input Box */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about your invoice, upcoming renewal, proration, or plan comparison..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sending}
            className="flex-1 text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="px-5 py-3 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white shadow-md shadow-brand-500/25 transition-all flex items-center gap-1.5"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};


'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Sparkles, Send, RotateCcw, Save, Maximize2, Minimize2,
  ChevronLeft, ChevronRight, Wand2, Palette, LayoutGrid, Type, Image, AlertTriangle,
  Undo2, Redo2, Accessibility, PenTool, HelpCircle, Target, ImagePlus,
} from 'lucide-react';
import type { AlignmentReport, ObjectiveCoverage } from '@/lib/agents/types';
import { injectSelectionBridge, stripSelectionBridge } from '@/lib/slide-studio/bridge';
import { extractSlideForEditing, spliceSlideBack, type ParsedSlides } from '@/lib/slide-studio/slide-utils';
import type { ElementContext, SlideEditMessage } from '@/lib/agents/types';

interface SlideStudioProps {
  lessonId: string;
  lessonTitle: string;
  initialSlide?: number;
  onClose: () => void;
  onSaved?: () => void;
}

interface VersionEntry {
  id: string;
  version_number: number;
  storage_path: string;
  summary: string;
  edit_instruction: string | null;
  html_char_count: number | null;
  created_at: string;
}

// Sentinel values for Quick Actions that route to different APIs
const SENTINEL_QUIZ = '__GENERATE_QUIZ__';
const SENTINEL_ALIGN = '__CHECK_OBJECTIVES__';
const SENTINEL_IMAGE = '__GENERATE_IMAGE__';

const QUICK_ACTIONS = [
  { label: 'Enhance layout', icon: LayoutGrid, prompt: 'Improve the overall layout and spacing of this slide deck. Make it look more professional and visually balanced.' },
  { label: 'Fix colors', icon: Palette, prompt: 'Review and fix the color scheme to match the AviLearn dark theme: #14171f canvas, #1c1f2a surface, #e6e9f2 text, #2dd4bf accent. Fix any contrast issues.' },
  { label: 'Add diagram', icon: Image, prompt: 'Add a relevant visual diagram (as inline SVG) to the current slide that illustrates the key concept being discussed.' },
  { label: 'Improve typography', icon: Type, prompt: 'Improve the typography: better font sizes, line heights, letter spacing, and text hierarchy. Use Inter font from Google Fonts.' },
  { label: 'Redesign slide', icon: Wand2, prompt: 'Completely redesign the current slide with a premium, modern look while keeping the same content and information.' },
  { label: 'Accessibility fix', icon: Accessibility, prompt: 'Audit and fix accessibility issues: ensure WCAG AA contrast ratios (4.5:1 for text, 3:1 for UI), add alt text to images, use semantic heading hierarchy (h1-h3), ensure keyboard-navigable interactive elements have visible focus states, and add aria-labels where needed.' },
  { label: 'Improve diagrams', icon: PenTool, prompt: 'Improve all diagrams and visual elements in this deck. Replace any low-quality or placeholder visuals with clean, professional inline SVG diagrams. Add proper labels, colors from the design system, and subtle animations.' },
  { label: 'Generate quiz', icon: HelpCircle, prompt: SENTINEL_QUIZ },
  { label: 'Check objectives', icon: Target, prompt: SENTINEL_ALIGN },
  { label: 'Generate image', icon: ImagePlus, prompt: SENTINEL_IMAGE },
];

export function SlideStudio({ lessonId, lessonTitle, initialSlide, onClose, onSaved }: SlideStudioProps) {
  // --- State ---
  const [currentHtml, setCurrentHtml] = useState<string>('');
  const [originalHtml, setOriginalHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<SlideEditMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingExplanation, setStreamingExplanation] = useState('');
  const [selectedElement, setSelectedElement] = useState<ElementContext | null>(null);
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editCount, setEditCount] = useState(0);
  const [loadingVersion, setLoadingVersion] = useState(false);
  const [lastInstruction, setLastInstruction] = useState('');
  const [slideInfo, setSlideInfo] = useState<{ current: number; total: number } | null>(null);

  // Undo/Redo stack
  const [htmlHistory, setHtmlHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const initialSlideApplied = useRef(false);

  // --- Load lesson content ---
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/lessons/${lessonId}/content`);
        if (res.ok) {
          const html = await res.text();
          setOriginalHtml(html);
          setCurrentHtml(html);
          // Initialize history with the original
          setHtmlHistory([html]);
          setHistoryIndex(0);
        }
      } catch {
        // Silently handle — empty state shown
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [lessonId]);

  // --- Load version history ---
  useEffect(() => {
    fetch(`/api/lessons/${lessonId}/versions`)
      .then(r => r.json())
      .then(data => setVersions(data.versions || []))
      .catch(() => {});
  }, [lessonId, editCount]);

  // --- Listen for iframe messages (element selection + slide info) ---
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data && e.data.type === 'element-selected') {
        setSelectedElement({
          tagName: e.data.tagName,
          cssSelector: e.data.cssSelector,
          textPreview: e.data.textPreview,
          outerHTML: e.data.outerHTML,
        });
      }
      if (e.data && e.data.type === 'slide-info') {
        setSlideInfo({ current: e.data.current, total: e.data.total });
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // --- Auto-scroll chat ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingExplanation]);

  // --- Get the HTML with bridge injected for preview ---
  // Pass initialSlide only on the first load so subsequent re-renders
  // (after AI edits) don't re-inject the goto script
  const slideForBridge = (!initialSlideApplied.current && initialSlide && initialSlide > 0)
    ? initialSlide : undefined;
  if (slideForBridge) initialSlideApplied.current = true;
  const previewHtml = currentHtml ? injectSelectionBridge(currentHtml, slideForBridge) : '';

  // --- Undo/Redo helpers ---
  const pushHistory = useCallback((html: string) => {
    setHtmlHistory(prev => {
      // Truncate any redo-future when a new edit is made
      const truncated = prev.slice(0, historyIndex + 1);
      const next = [...truncated, html];
      // Keep max 30 entries to avoid memory bloat
      if (next.length > 30) next.shift();
      setHistoryIndex(next.length - 1);
      return next;
    });
  }, [historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < htmlHistory.length - 1;

  const undo = useCallback(() => {
    if (!canUndo) return;
    const newIdx = historyIndex - 1;
    setHistoryIndex(newIdx);
    setCurrentHtml(htmlHistory[newIdx]);
    setHasUnsavedChanges(true);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Undo — reverted to edit ${newIdx} of ${htmlHistory.length - 1}`,
      timestamp: new Date().toISOString(),
    }]);
  }, [canUndo, historyIndex, htmlHistory]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    const newIdx = historyIndex + 1;
    setHistoryIndex(newIdx);
    setCurrentHtml(htmlHistory[newIdx]);
    setHasUnsavedChanges(true);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Redo — restored edit ${newIdx} of ${htmlHistory.length - 1}`,
      timestamp: new Date().toISOString(),
    }]);
  }, [canRedo, historyIndex, htmlHistory]);

  // --- Keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z) ---
  useEffect(() => {
    function handleKeyboard(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    }
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [undo, redo]);

  // --- Send edit instruction to AI ---
  // --- Load a previous version's HTML ---
  const loadVersion = useCallback(async (version: VersionEntry) => {
    setLoadingVersion(true);
    try {
      // Fetch the versioned HTML from storage via a proxy approach:
      // We download from the versions API content endpoint
      const res = await fetch(`/api/lessons/${lessonId}/content?path=${encodeURIComponent(version.storage_path)}`);
      if (res.ok) {
        const html = await res.text();
        setCurrentHtml(html);
        pushHistory(html);
        setHasUnsavedChanges(true);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Loaded version ${version.version_number}: "${version.summary || 'Previous edit'}"`,
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch {
      // silently handle
    } finally {
      setLoadingVersion(false);
    }
  }, [lessonId]);

  // --- Check document size for 30K warning ---
  const isDocLarge = currentHtml.length > 100_000;

  // --- Special action: Generate Quiz (SSE to /quiz endpoint) ---
  const handleQuizAction = useCallback(async () => {
    if (isStreaming) return;
    setIsStreaming(true);
    setMessages(prev => [...prev, {
      role: 'user', content: '📝 Generate quiz from this slide', timestamp: new Date().toISOString(),
    }]);
    setStreamingExplanation('Generating quiz questions...');
    try {
      const cleanHtml = stripSelectionBridge(currentHtml);
      const res = await fetch(`/api/lessons/${lessonId}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentHtml: cleanHtml }),
      });
      if (!res.ok) throw new Error(`Quiz generation failed: ${res.status}`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');
      const decoder = new TextDecoder();
      let buffer = '';
      let newHtml: string | null = null;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(part.slice(6));
            if (evt.type === 'text') setStreamingExplanation(evt.content);
            else if (evt.type === 'html') newHtml = evt.content;
          } catch { /* partial JSON */ }
        }
      }
      setStreamingExplanation('');
      setMessages(prev => [...prev, {
        role: 'assistant', content: '✅ Quiz generated! The quiz has been added as an interactive slide.',
        timestamp: new Date().toISOString(),
      }]);
      if (newHtml) {
        setCurrentHtml(newHtml);
        pushHistory(newHtml);
        setHasUnsavedChanges(true);
        setEditCount(c => c + 1);
      }
    } catch (err) {
      setStreamingExplanation('');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠ Quiz error: ${err instanceof Error ? err.message : 'Failed'}`,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, currentHtml, lessonId, messages, pushHistory]);

  // --- Special action: Check Objectives (JSON from /align endpoint) ---
  const handleAlignAction = useCallback(async () => {
    if (isStreaming) return;
    setIsStreaming(true);
    setMessages(prev => [...prev, {
      role: 'user', content: '🎯 Check objective alignment', timestamp: new Date().toISOString(),
    }]);
    setStreamingExplanation('Analyzing objective coverage...');
    try {
      const cleanHtml = stripSelectionBridge(currentHtml);
      const res = await fetch(`/api/lessons/${lessonId}/align`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentHtml: cleanHtml }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Alignment check failed: ${res.status}`);
      }
      const report: AlignmentReport = await res.json();
      setStreamingExplanation('');
      // Render the report as a structured message
      const coverageIcon = (c: ObjectiveCoverage) =>
        c === 'fully_covered' ? '🟢' : c === 'partially_covered' ? '🟡' : '🔴';
      const lines = [
        `**Objective Coverage: ${report.overallCoverage}%**\n`,
        ...report.objectives.map(o =>
          `${coverageIcon(o.coverage)} **[${o.index}]** ${o.text.slice(0, 80)}${o.text.length > 80 ? '...' : ''}\n` +
          (o.evidence !== 'No relevant content found' ? `   Evidence: "${o.evidence.slice(0, 100)}"\n` : '') +
          (o.suggestion ? `   → ${o.suggestion}` : '')
        ),
        '',
        ...report.recommendations.map(r => `💡 ${r}`),
      ];
      setMessages(prev => [...prev, {
        role: 'assistant', content: lines.join('\n'), timestamp: new Date().toISOString(),
      }]);
    } catch (err) {
      setStreamingExplanation('');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠ Alignment error: ${err instanceof Error ? err.message : 'Failed'}`,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, currentHtml, lessonId, messages]);

  // --- Special action: Generate Image (JSON from /image, then embed via edit) ---
  const handleImageAction = useCallback(async () => {
    if (isStreaming) return;
    setIsStreaming(true);
    setMessages(prev => [...prev, {
      role: 'user', content: '🖼️ Generate contextual image', timestamp: new Date().toISOString(),
    }]);
    setStreamingExplanation('Writing image prompt and generating...');
    try {
      const cleanHtml = stripSelectionBridge(currentHtml);
      const res = await fetch(`/api/lessons/${lessonId}/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentHtml: cleanHtml }),
      });
      if (!res.ok) throw new Error(`Image generation failed: ${res.status}`);
      const { base64DataUri, altText, prompt: imgPrompt } = await res.json();
      setStreamingExplanation('Embedding image into slide...');
      // Now send the image through the normal edit pipeline to embed it
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Image generated for: "${imgPrompt.slice(0, 80)}..."\nEmbedding into slide...`,
        timestamp: new Date().toISOString(),
      }]);
      setIsStreaming(false);
      setStreamingExplanation('');
      // Use the standard sendInstruction to embed the image
      const embedInstruction = `Insert this image at the most appropriate position in the current slide. Use this exact img tag: <img src="${base64DataUri}" alt="${altText}" style="max-width: 100%; border-radius: 8px; margin: 16px auto; display: block;" />`;
      // Delay briefly to let state settle
      setTimeout(() => sendInstruction(embedInstruction), 100);
      return; // sendInstruction handles the rest
    } catch (err) {
      setStreamingExplanation('');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠ Image error: ${err instanceof Error ? err.message : 'Failed'}`,
        timestamp: new Date().toISOString(),
      }]);
      setIsStreaming(false);
    }
  }, [isStreaming, currentHtml, lessonId, messages]);

  const sendInstruction = useCallback(async (instruction: string) => {
    if (!instruction.trim() || isStreaming) return;

    // --- Route sentinel prompts to special handlers ---
    if (instruction === SENTINEL_QUIZ) return handleQuizAction();
    if (instruction === SENTINEL_ALIGN) return handleAlignAction();
    if (instruction === SENTINEL_IMAGE) return handleImageAction();

    setLastInstruction(instruction);

    const userMessage: SlideEditMessage = {
      role: 'user',
      content: instruction,
      elementContext: selectedElement || undefined,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setDraft('');
    setIsStreaming(true);
    setStreamingExplanation('');
    setSelectedElement(null);

    // Clear selection in iframe
    iframeRef.current?.contentWindow?.postMessage({ type: 'studio-clear-selection' }, '*');

    try {
      const cleanHtml = stripSelectionBridge(currentHtml);

      // --- Per-slide editing for large documents ---
      // If the document is too large, extract just the current slide
      let htmlToSend = cleanHtml;
      let slideEditContext: { slideIndex: number; parsed: ParsedSlides } | null = null;

      if (cleanHtml.length > 100_000 && slideInfo) {
        const slideIdx = slideInfo.current - 1; // Convert 1-indexed to 0-indexed
        const extracted = extractSlideForEditing(cleanHtml, slideIdx);
        if (extracted) {
          htmlToSend = extracted.slideDoc;
          slideEditContext = { slideIndex: slideIdx, parsed: extracted.parsed };
          // Inform the user we're editing per-slide
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `📋 Large document — editing slide ${slideInfo.current} only (${(htmlToSend.length / 1000).toFixed(0)}K chars sent to AI)`,
            timestamp: new Date().toISOString(),
          }]);
        }
      }

      const res = await fetch(`/api/lessons/${lessonId}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction,
          elementContext: userMessage.elementContext,
          conversationHistory: messages.slice(-6),
          currentHtml: htmlToSend,
        }),
      });

      if (!res.ok) {
        // Try to extract a descriptive error from the response body
        let errorDetail = `API error: ${res.status}`;
        try {
          const errBody = await res.json();
          if (errBody?.error) errorDetail = errBody.error;
        } catch { /* fall through to generic message */ }
        throw new Error(errorDetail);
      }

      // Parse SSE stream
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let finalExplanation = '';
      let newHtml: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        // Process lines with proper index tracking (fixes indexOf bug)
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.startsWith('event: ')) {
            const eventType = line.slice(7).trim();
            // Next line should be data:
            const nextIdx = i + 1;
            if (nextIdx < lines.length && lines[nextIdx].startsWith('data: ')) {
              try {
                const data = JSON.parse(lines[nextIdx].slice(6));
                if (eventType === 'explanation') {
                  finalExplanation = data;
                  setStreamingExplanation(data);
                } else if (eventType === 'html') {
                  newHtml = data;
                } else if (eventType === 'error') {
                  throw new Error(data);
                }
                i++; // Skip the data line since we consumed it
              } catch (e) {
                if (e instanceof SyntaxError) continue; // Ignore JSON parse errors on partial data
                throw e;
              }
            }
          }
        }
      }

      // Apply the result
      const assistantMessage: SlideEditMessage = {
        role: 'assistant',
        content: finalExplanation || 'Changes applied.',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingExplanation('');

      if (newHtml) {
        // If we edited per-slide, splice the result back into the full doc
        let finalHtml = newHtml;
        if (slideEditContext) {
          finalHtml = spliceSlideBack(
            stripSelectionBridge(currentHtml),
            slideEditContext.slideIndex,
            newHtml,
            slideEditContext.parsed,
          );
        }
        setCurrentHtml(finalHtml);
        pushHistory(finalHtml);
        setHasUnsavedChanges(true);
        setEditCount(c => c + 1);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠ Error: ${errorMsg}. Please try again.`,
        timestamp: new Date().toISOString(),
      }]);
      setStreamingExplanation('');
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }, [isStreaming, selectedElement, currentHtml, messages, lessonId, handleQuizAction, handleAlignAction, handleImageAction]);

  // --- Save current HTML ---
  async function handleSave() {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
      const res = await fetch(`/api/lessons/${lessonId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: stripSelectionBridge(currentHtml),
          summary: lastAssistantMsg?.content.slice(0, 80) || 'Manual save',
          editInstruction: lastInstruction || undefined,
        }),
      });

      if (res.ok) {
        setHasUnsavedChanges(false);
        setOriginalHtml(currentHtml);
        setEditCount(c => c + 1);
        onSaved?.();
      }
    } finally {
      setIsSaving(false);
    }
  }

  // --- Reset to original ---
  function handleReset() {
    setCurrentHtml(originalHtml);
    setHasUnsavedChanges(false);
    setSelectedElement(null);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Reset to the last saved version.',
      timestamp: new Date().toISOString(),
    }]);
  }

  // --- Handle keyboard submit ---
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendInstruction(draft);
    }
  }

  // --- Auto-resize textarea ---
  function handleDraftChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(e.target.value);
    // Reset height then set to scrollHeight for auto-grow
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  }

  // --- Render ---
  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="lesson-viewer-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--fg-3)' }}>
            Loading lesson content...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`slide-studio ${isFullscreen ? 'slide-studio--fullscreen' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* --- Header --- */}
        <div className="studio-header">
          <div className="studio-header-left">
            <Sparkles size={16} style={{ color: 'var(--brand)' }} />
            <span className="studio-header-title">{lessonTitle}</span>
            {hasUnsavedChanges && (
              <span className="studio-unsaved-badge">Unsaved</span>
            )}
          </div>
          <div className="studio-header-right">
            <button
              className="btn btn-ghost btn-sm"
              onClick={undo}
              disabled={!canUndo || isStreaming}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={14} />
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={redo}
              disabled={!canRedo || isStreaming}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 size={14} />
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleReset}
              disabled={!hasUnsavedChanges}
              title="Reset to last saved"
            >
              <RotateCcw size={14} /> Reset
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              title="Save changes"
            >
              <Save size={14} /> {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setIsFullscreen(f => !f)}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* --- Main Content --- */}
        <div className="studio-body">
          {/* Left: Preview Pane */}
          <div className="studio-preview">
            {/* 30K char warning */}
            {isDocLarge && (
              <div className="studio-size-warning">
                <AlertTriangle size={14} />
                <span>Large document ({(currentHtml.length / 1000).toFixed(0)}K chars) — AI edits may be slow or hit limits</span>
              </div>
            )}
            <iframe
              ref={iframeRef}
              srcDoc={previewHtml}
              className="studio-iframe"
              title="Slide Preview"
              sandbox="allow-scripts allow-same-origin"
              onLoad={() => {
                // Request slide info from the bridge after it initializes
                setTimeout(() => {
                  iframeRef.current?.contentWindow?.postMessage(
                    { type: 'studio-get-slide-info' }, '*'
                  );
                }, 300);
              }}
            />

            {/* Slide navigation controls */}
            {slideInfo && slideInfo.total > 1 && (
              <div className="studio-slide-nav">
                <button
                  className="studio-slide-nav-btn"
                  onClick={() => {
                    iframeRef.current?.contentWindow?.postMessage(
                      { type: 'studio-nav', direction: 'prev' }, '*'
                    );
                  }}
                  disabled={slideInfo.current <= 1}
                  title="Previous slide"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="studio-slide-indicator">
                  Slide {slideInfo.current} / {slideInfo.total}
                </span>
                <button
                  className="studio-slide-nav-btn"
                  onClick={() => {
                    iframeRef.current?.contentWindow?.postMessage(
                      { type: 'studio-nav', direction: 'next' }, '*'
                    );
                  }}
                  disabled={slideInfo.current >= slideInfo.total}
                  title="Next slide"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Version timeline */}
            {versions.length > 0 && (
              <div className="studio-version-strip">
                <span className="studio-version-label">History:</span>
                <div className="studio-version-dot studio-version-dot--current" title="Current (working)">
                  ●
                </div>
                {versions.slice(0, 8).map((v) => (
                  <div
                    key={v.id}
                    className="studio-version-dot"
                    title={`v${v.version_number}: ${v.summary || 'Edit'}`}
                    onClick={() => loadVersion(v)}
                    style={{ cursor: loadingVersion ? 'wait' : 'pointer' }}
                  >
                    ○
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Chat Pane */}
          <div className="studio-chat">
            {/* Chat header */}
            <div className="studio-chat-header">
              <Sparkles size={14} style={{ color: 'var(--brand)' }} />
              <span>Slide Studio</span>
            </div>

            {/* Messages */}
            <div className="studio-messages">
              {/* Welcome message */}
              {messages.length === 0 && !isStreaming && (
                <div className="studio-welcome">
                  <div className="studio-welcome-icon">
                    <Wand2 size={24} />
                  </div>
                  <h3>Design with AI</h3>
                  <p>
                    Click any element in the preview to select it, then describe what you'd like to change.
                    Or use a quick action below to get started.
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`studio-msg ${msg.role === 'user' ? 'studio-msg--user' : 'studio-msg--ai'}`}>
                  {msg.role === 'assistant' && (
                    <div className="studio-msg-avatar">
                      <Sparkles size={12} />
                    </div>
                  )}
                  <div className="studio-msg-content">
                    {msg.elementContext && (
                      <div className="studio-msg-context">
                        🎯 Targeting: &lt;{msg.elementContext.tagName}&gt; — "{msg.elementContext.textPreview.slice(0, 50)}..."
                      </div>
                    )}
                    <div className="studio-msg-text">{msg.content}</div>
                  </div>
                </div>
              ))}

              {/* Streaming indicator */}
              {isStreaming && (
                <div className="studio-msg studio-msg--ai">
                  <div className="studio-msg-avatar">
                    <Sparkles size={12} />
                  </div>
                  <div className="studio-msg-content">
                    <div className="studio-msg-text">
                      {streamingExplanation || (
                        <span className="studio-typing">
                          <span>●</span><span>●</span><span>●</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick actions — always visible */}
            {!isStreaming && (
              <div className="studio-quick-actions">
                {QUICK_ACTIONS.map((action, i) => (
                  <button
                    key={i}
                    className="studio-chip"
                    onClick={() => sendInstruction(action.prompt)}
                    disabled={isStreaming}
                  >
                    <action.icon size={12} />
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {/* Element context bar */}
            {selectedElement && (
              <div className="studio-element-bar">
                <span className="studio-element-tag">🎯 &lt;{selectedElement.tagName}&gt;</span>
                <span className="studio-element-preview">
                  {selectedElement.textPreview.slice(0, 60)}{selectedElement.textPreview.length > 60 ? '…' : ''}
                </span>
                <button
                  className="studio-element-clear"
                  onClick={() => {
                    setSelectedElement(null);
                    iframeRef.current?.contentWindow?.postMessage({ type: 'studio-clear-selection' }, '*');
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Composer */}
            <div className="studio-composer">
              <textarea
                ref={inputRef}
                className="studio-input studio-textarea"
                placeholder={selectedElement
                  ? `Describe changes for <${selectedElement.tagName}>...`
                  : 'Describe a design change...'
                }
                value={draft}
                onChange={handleDraftChange}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
                rows={1}
              />
              <button
                className="btn btn-primary studio-send-btn"
                onClick={() => sendInstruction(draft)}
                disabled={isStreaming || !draft.trim()}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

interface ExportPanelProps {
  compositeUrl: string | null;
  albumInfo: { title: string; artist: string } | null;
}

export function ExportPanel({ compositeUrl, albumInfo }: ExportPanelProps) {
  const [copied, setCopied] = useState(false);
  const [shareText, setShareText] = useState('');

  const handleDownload = useCallback(() => {
    if (!compositeUrl) return;

    const link = document.createElement('a');
    link.href = compositeUrl;
    const albumPart = albumInfo
      ? `${albumInfo.artist}-${albumInfo.title}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
      : 'composite';
    link.download = `coverblend-${albumPart}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [compositeUrl, albumInfo]);

  const handleCopyLink = useCallback(async () => {
    if (!compositeUrl) return;

    try {
      // For data URLs, copy the URL to clipboard
      await navigator.clipboard.writeText(compositeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = compositeUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [compositeUrl]);

  const generateShareText = useCallback(() => {
    const text = albumInfo
      ? `Check out my photo blended with "${albumInfo.title}" by ${albumInfo.artist} using CoverBlend!`
      : 'Check out my photo blend created with CoverBlend!';
    setShareText(text);
  }, [albumInfo]);

  const handleCopyShareText = useCallback(async () => {
    if (!shareText) return;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent fail
    }
  }, [shareText]);

  const isDisabled = !compositeUrl;

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-semibold text-zinc-200">Export</h3>

      {/* Download */}
      <Button
        variant="primary"
        size="md"
        className="w-full"
        onClick={handleDownload}
        disabled={isDisabled}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
        Download PNG
      </Button>

      {/* Copy link */}
      <Button
        variant="secondary"
        size="md"
        className="w-full"
        onClick={handleCopyLink}
        disabled={isDisabled}
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.span
              key="copied"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-2"
            >
              <svg
                className="w-4 h-4 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Copied!
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                />
              </svg>
              Copy Image Data
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      {/* Divider */}
      <div className="h-px bg-zinc-800" />

      {/* Social share text */}
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={generateShareText}
          disabled={isDisabled}
        >
          Generate Share Text
        </Button>

        <AnimatePresence>
          {shareText && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
                <p className="text-sm text-zinc-300 mb-3">{shareText}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyShareText}
                  className={cn(copied && 'text-emerald-400')}
                >
                  {copied ? 'Copied!' : 'Copy Text'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Album info */}
      {albumInfo && (
        <div className="rounded-lg bg-zinc-800/30 border border-zinc-800 p-3">
          <p className="text-xs text-zinc-500 mb-1">Matched Album</p>
          <p className="text-sm font-medium text-zinc-200">{albumInfo.title}</p>
          <p className="text-xs text-zinc-400">{albumInfo.artist}</p>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useRef, useState, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your article content here...',
  minHeight = '320px',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState(value || '');
  const [isUploading, setIsUploading] = useState(false);
  const [activeFormats, setActiveFormats] = useState<{ [key: string]: boolean }>({});
  const [wordCount, setWordCount] = useState(0);

  // Sync internal state when external value changes initially
  useEffect(() => {
    if (editorRef.current && !isHtmlMode) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
    setHtmlContent(value || '');
    updateWordCount(value || '');
  }, [value, isHtmlMode]);

  const updateWordCount = (html: string) => {
    if (typeof window === 'undefined') return;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setHtmlContent(html);
      onChange(html);
      updateWordCount(html);
      checkActiveFormats();
    }
  };

  const execute = (command: string, val: string | undefined = undefined) => {
    if (typeof window === 'undefined') return;
    if (isHtmlMode) return;
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    handleInput();
  };

  const checkActiveFormats = () => {
    if (typeof window === 'undefined' || isHtmlMode) return;
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
      });
    } catch (e) {}
  };

  const handleFormatBlock = (tag: string) => {
    if (tag === 'p') {
      execute('formatBlock', '<p>');
    } else {
      execute('formatBlock', `<${tag}>`);
    }
  };

  const handleInsertLink = () => {
    const url = prompt('Enter link URL (e.g. https://example.com):');
    if (url) {
      execute('createLink', url);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Image upload failed');

      if (data.url) {
        editorRef.current?.focus();
        const imgHtml = `<p><img src="${data.url}" alt="Article graphic" style="max-width:100%; height:auto; border-radius:10px; margin: 16px 0; display: block;" /></p><p></p>`;
        document.execCommand('insertHTML', false, imgHtml);
        handleInput();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleHtmlCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const html = e.target.value;
    setHtmlContent(html);
    onChange(html);
    updateWordCount(html);
  };

  const toggleHtmlMode = () => {
    if (isHtmlMode) {
      // Switching from HTML to Visual
      if (editorRef.current) {
        editorRef.current.innerHTML = htmlContent;
      }
    }
    setIsHtmlMode(!isHtmlMode);
  };

  return (
    <div
      className="rich-text-editor-container border rounded-3 overflow-hidden bg-white shadow-sm"
      style={{ borderColor: '#cbd5e1' }}
    >
      {/* Editor Toolbar (Word-like styling) */}
      <div
        className="editor-toolbar d-flex flex-wrap align-items-center gap-1 p-2 border-bottom"
        style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
      >
        {/* Undo / Redo */}
        <div className="btn-group btn-group-sm me-1">
          <button
            type="button"
            className="btn btn-light border text-secondary"
            onClick={() => execute('undo')}
            title="Undo (Ctrl+Z)"
            disabled={isHtmlMode}
          >
            <i className="las la-undo"></i>
          </button>
          <button
            type="button"
            className="btn btn-light border text-secondary"
            onClick={() => execute('redo')}
            title="Redo (Ctrl+Y)"
            disabled={isHtmlMode}
          >
            <i className="las la-redo"></i>
          </button>
        </div>

        {/* Headings */}
        <div className="me-1">
          <select
            className="form-select form-select-sm"
            style={{ width: '120px', fontSize: '13px' }}
            disabled={isHtmlMode}
            onChange={(e) => {
              handleFormatBlock(e.target.value);
              e.target.value = '';
            }}
            defaultValue=""
          >
            <option value="" disabled>
              Heading...
            </option>
            <option value="p">Normal (P)</option>
            <option value="h1">Heading 1 (H1)</option>
            <option value="h2">Heading 2 (H2)</option>
            <option value="h3">Heading 3 (H3)</option>
            <option value="h4">Heading 4 (H4)</option>
          </select>
        </div>

        {/* Text Formats: Bold, Italic, Underline, Strikethrough */}
        <div className="btn-group btn-group-sm me-1">
          <button
            type="button"
            className={`btn btn-light border ${activeFormats.bold ? 'active bg-success text-white' : 'text-dark fw-bold'}`}
            onClick={() => execute('bold')}
            title="Bold (Ctrl+B)"
            disabled={isHtmlMode}
          >
            <i className="las la-bold"></i>
          </button>
          <button
            type="button"
            className={`btn btn-light border ${activeFormats.italic ? 'active bg-success text-white' : 'text-dark fst-italic'}`}
            onClick={() => execute('italic')}
            title="Italic (Ctrl+I)"
            disabled={isHtmlMode}
          >
            <i className="las la-italic"></i>
          </button>
          <button
            type="button"
            className={`btn btn-light border ${activeFormats.underline ? 'active bg-success text-white' : 'text-dark text-decoration-underline'}`}
            onClick={() => execute('underline')}
            title="Underline (Ctrl+U)"
            disabled={isHtmlMode}
          >
            <i className="las la-underline"></i>
          </button>
          <button
            type="button"
            className={`btn btn-light border ${activeFormats.strikeThrough ? 'active bg-success text-white' : 'text-dark text-decoration-line-through'}`}
            onClick={() => execute('strikeThrough')}
            title="Strikethrough"
            disabled={isHtmlMode}
          >
            <i className="las la-strikethrough"></i>
          </button>
        </div>

        {/* Text Color Picker */}
        <div className="btn-group btn-group-sm me-1">
          <label
            className="btn btn-light border text-dark d-flex align-items-center m-0 px-2"
            title="Font Color"
            style={{ cursor: isHtmlMode ? 'not-allowed' : 'pointer' }}
          >
            <i className="las la-font text-primary me-1"></i>
            <input
              type="color"
              onChange={(e) => execute('foreColor', e.target.value)}
              disabled={isHtmlMode}
              style={{
                width: '16px',
                height: '16px',
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
              title="Pick Text Color"
            />
          </label>
          <label
            className="btn btn-light border text-dark d-flex align-items-center m-0 px-2"
            title="Highlight / Background Color"
            style={{ cursor: isHtmlMode ? 'not-allowed' : 'pointer' }}
          >
            <i className="las la-highlighter text-warning me-1"></i>
            <input
              type="color"
              defaultValue="#fef08a"
              onChange={(e) => execute('hiliteColor', e.target.value)}
              disabled={isHtmlMode}
              style={{
                width: '16px',
                height: '16px',
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
              title="Pick Highlight Color"
            />
          </label>
        </div>

        {/* Text Alignment */}
        <div className="btn-group btn-group-sm me-1">
          <button
            type="button"
            className={`btn btn-light border ${activeFormats.justifyLeft ? 'active bg-secondary text-white' : 'text-secondary'}`}
            onClick={() => execute('justifyLeft')}
            title="Align Left"
            disabled={isHtmlMode}
          >
            <i className="las la-align-left"></i>
          </button>
          <button
            type="button"
            className={`btn btn-light border ${activeFormats.justifyCenter ? 'active bg-secondary text-white' : 'text-secondary'}`}
            onClick={() => execute('justifyCenter')}
            title="Align Center"
            disabled={isHtmlMode}
          >
            <i className="las la-align-center"></i>
          </button>
          <button
            type="button"
            className={`btn btn-light border ${activeFormats.justifyRight ? 'active bg-secondary text-white' : 'text-secondary'}`}
            onClick={() => execute('justifyRight')}
            title="Align Right"
            disabled={isHtmlMode}
          >
            <i className="las la-align-right"></i>
          </button>
        </div>

        {/* Lists & Quotes */}
        <div className="btn-group btn-group-sm me-1">
          <button
            type="button"
            className={`btn btn-light border ${activeFormats.insertUnorderedList ? 'active bg-success text-white' : 'text-secondary'}`}
            onClick={() => execute('insertUnorderedList')}
            title="Bullet List"
            disabled={isHtmlMode}
          >
            <i className="las la-list-ul"></i>
          </button>
          <button
            type="button"
            className={`btn btn-light border ${activeFormats.insertOrderedList ? 'active bg-success text-white' : 'text-secondary'}`}
            onClick={() => execute('insertOrderedList')}
            title="Numbered List"
            disabled={isHtmlMode}
          >
            <i className="las la-list-ol"></i>
          </button>
          <button
            type="button"
            className="btn btn-light border text-secondary"
            onClick={() => execute('formatBlock', '<blockquote>')}
            title="Blockquote"
            disabled={isHtmlMode}
          >
            <i className="las la-quote-right"></i>
          </button>
          <button
            type="button"
            className="btn btn-light border text-secondary"
            onClick={() => execute('insertHorizontalRule')}
            title="Divider Line"
            disabled={isHtmlMode}
          >
            <i className="las la-minus"></i>
          </button>
        </div>

        {/* Links & In-Body Media Upload */}
        <div className="btn-group btn-group-sm me-1">
          <button
            type="button"
            className="btn btn-light border text-primary"
            onClick={handleInsertLink}
            title="Insert Link"
            disabled={isHtmlMode}
          >
            <i className="las la-link"></i> Link
          </button>

          {/* Local Image Upload inside Article Body */}
          <label
            className="btn btn-light border text-success d-flex align-items-center m-0 px-2"
            title="Upload and insert image at cursor"
            style={{ cursor: isHtmlMode || isUploading ? 'not-allowed' : 'pointer' }}
          >
            {isUploading ? (
              <span className="spinner-border spinner-border-sm me-1"></span>
            ) : (
              <i className="las la-image me-1"></i>
            )}
            <span>{isUploading ? 'Uploading...' : 'Insert Photo'}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isHtmlMode || isUploading}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {/* Clear Format */}
        <button
          type="button"
          className="btn btn-sm btn-light border text-danger me-auto"
          onClick={() => execute('removeFormat')}
          title="Clear Formatting"
          disabled={isHtmlMode}
        >
          <i className="las la-eraser"></i>
        </button>

        {/* Toggle Visual / HTML Mode */}
        <button
          type="button"
          className={`btn btn-sm ${isHtmlMode ? 'btn-dark' : 'btn-outline-secondary'}`}
          onClick={toggleHtmlMode}
          title={isHtmlMode ? 'Switch to Visual Editor' : 'Switch to Raw HTML Mode'}
        >
          <i className="las la-code me-1"></i>
          <span>{isHtmlMode ? 'Visual Editor' : 'HTML Code'}</span>
        </button>
      </div>

      {/* Editor Content Area */}
      {isHtmlMode ? (
        <textarea
          className="form-control border-0 font-monospace p-3"
          style={{
            minHeight,
            fontSize: '13.5px',
            lineHeight: '1.6',
            resize: 'vertical',
            outline: 'none',
          }}
          value={htmlContent}
          onChange={handleHtmlCodeChange}
          placeholder="Enter raw HTML content..."
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyUp={checkActiveFormats}
          onMouseUp={checkActiveFormats}
          className="p-3"
          style={{
            minHeight,
            maxHeight: '480px',
            overflowY: 'auto',
            outline: 'none',
            fontSize: '15px',
            lineHeight: '1.7',
            color: '#1e293b',
          }}
          data-placeholder={placeholder}
        />
      )}

      {/* Editor Footer / Info Bar */}
      <div
        className="d-flex align-items-center justify-content-between px-3 py-1 border-top bg-light text-muted"
        style={{ fontSize: '12px' }}
      >
        <span className="d-flex align-items-center gap-2">
          <i className="las la-info-circle text-primary"></i>
          <span>
            {isHtmlMode
              ? 'Raw HTML mode active'
              : 'Type naturally. Use the toolbar or shortcuts (Ctrl+B, Ctrl+I) to format.'}
          </span>
        </span>
        <span className="fw-semibold">
          {wordCount} {wordCount === 1 ? 'Word' : 'Words'}
        </span>
      </div>
    </div>
  );
}

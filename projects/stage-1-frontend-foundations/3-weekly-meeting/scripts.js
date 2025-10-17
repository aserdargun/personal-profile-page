'use strict';

(function () {
  const STORAGE_KEY = 'weekly-meeting-draft';
  const form = document.querySelector('#meeting-form');
  const statusMessage = document.querySelector('#form-status');
  const clearBtn = document.querySelector('#clear-draft');
  const exportBtn = document.querySelector('#export-draft');
  const importInput = document.querySelector('#import-file');
  const backToTop = document.querySelector('.back-to-top');

  if (backToTop) {
    const toggleBackToTop = () => {
      if (window.scrollY > 200) {
        backToTop.classList.add('is-visible');
      } else {
        backToTop.classList.remove('is-visible');
      }
    };

    toggleBackToTop();
    window.addEventListener('scroll', toggleBackToTop, { passive: true });
  }

  const inputs = form
    ? Array.from(form.querySelectorAll('input, textarea, select'))
    : [];

  const setStatus = (message) => {
    if (statusMessage) {
      statusMessage.textContent = message;
    }
  };

  const saveDraft = () => {
    if (!inputs.length) {
      return;
    }

    const payload = inputs.reduce((acc, field) => {
      if (field.type === 'checkbox') {
        acc[field.name] = field.checked;
      } else {
        acc[field.name] = field.value;
      }
      return acc;
    }, {});

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      const time = new Date().toLocaleTimeString();
      setStatus(`Draft saved at ${time}.`);
    } catch (error) {
      console.error('Unable to save draft', error);
      setStatus('Unable to save draft. Storage may be full or disabled.');
    }
  };

  const loadDraft = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setStatus('Draft not saved yet.');
        return;
      }

      const data = JSON.parse(raw);
      inputs.forEach((field) => {
        if (!(field.name in data)) {
          return;
        }
        if (field.type === 'checkbox') {
          field.checked = Boolean(data[field.name]);
        } else {
          field.value = data[field.name] ?? '';
        }
      });
      setStatus('Draft restored from local storage.');
    } catch (error) {
      console.error('Unable to load draft', error);
      setStatus('Failed to load saved draft.');
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    inputs.forEach((field) => {
      if (field.type === 'checkbox') {
        field.checked = false;
      } else if (field.type === 'date') {
        field.value = '';
      } else {
        field.value = '';
      }
    });
    setStatus('Draft cleared.');
  };

  const exportDraft = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) ?? '{}';
      const blob = new Blob([raw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'weekly-meeting-draft.json';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setStatus('Draft exported as JSON.');
    } catch (error) {
      console.error('Unable to export draft', error);
      setStatus('Export failed.');
    }
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        inputs.forEach((field) => {
          if (!(field.name in data)) {
            return;
          }
          if (field.type === 'checkbox') {
            field.checked = Boolean(data[field.name]);
          } else {
            field.value = data[field.name] ?? '';
          }
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setStatus('Draft imported successfully.');
      } catch (error) {
        console.error('Invalid import file', error);
        setStatus('Import failed. Ensure the file is a valid JSON export.');
      } finally {
        event.target.value = '';
      }
    };
    reader.onerror = () => {
      console.error('Unable to read import file');
      setStatus('Import failed while reading file.');
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  if (form) {
    loadDraft();
    form.addEventListener('input', saveDraft);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      saveDraft();
      setStatus('Snapshot recorded locally. Share via export if needed.');
    });
  }

  clearBtn?.addEventListener('click', clearDraft);
  exportBtn?.addEventListener('click', exportDraft);
  importInput?.addEventListener('change', handleImport);
})();

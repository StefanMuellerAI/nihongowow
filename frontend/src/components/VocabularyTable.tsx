'use client';

import { useState, useEffect, useCallback } from 'react';
import { vocabularyAPI, Vocabulary, VocabularyCreate } from '@/lib/api';
import { getToken } from '@/lib/auth';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Upload,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface EditingVocab {
  id: string;
  expression: string;
  reading: string;
  meaning: string;
  tags: string;
}

export default function VocabularyTable() {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingVocab | null>(null);

  // New vocabulary form
  const [isAdding, setIsAdding] = useState(false);
  const [newVocab, setNewVocab] = useState<VocabularyCreate>({
    expression: '',
    reading: '',
    meaning: '',
    tags: '',
  });

  // CSV Import
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const loadVocabularies = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await vocabularyAPI.getAll({
        page,
        page_size: 15,
        search: search || undefined,
      });
      setVocabularies(response.items);
      setTotalPages(response.total_pages);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vocabulary');
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadVocabularies();
  }, [loadVocabularies]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadVocabularies();
  };

  const handleEdit = (vocab: Vocabulary) => {
    setEditingId(vocab.id);
    setEditingData({
      id: vocab.id,
      expression: vocab.expression,
      reading: vocab.reading,
      meaning: vocab.meaning,
      tags: vocab.tags,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingData) return;
    const token = getToken();
    if (!token) return;

    try {
      await vocabularyAPI.update(
        editingData.id,
        {
          expression: editingData.expression,
          reading: editingData.reading,
          meaning: editingData.meaning,
          tags: editingData.tags,
        },
        token
      );
      setEditingId(null);
      setEditingData(null);
      loadVocabularies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vocabulary?')) return;
    const token = getToken();
    if (!token) return;

    try {
      await vocabularyAPI.delete(id, token);
      loadVocabularies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleAddNew = async () => {
    const token = getToken();
    if (!token) return;

    if (!newVocab.expression || !newVocab.reading || !newVocab.meaning) {
      setError('Expression, reading, and meaning are required');
      return;
    }

    try {
      await vocabularyAPI.create(newVocab, token);
      setNewVocab({ expression: '', reading: '', meaning: '', tags: '' });
      setIsAdding(false);
      loadVocabularies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = getToken();
    if (!token) return;

    setIsImporting(true);
    setImportResult(null);
    setError(null);

    try {
      const result = await vocabularyAPI.importCSV(file, token);
      setImportResult(result);
      loadVocabularies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-nihongo-text">Vocabulary</h2>
          <p className="text-nihongo-text-muted">{total} entries</p>
        </div>

        <div className="flex items-center gap-3">
          {/* CSV Import */}
          <label htmlFor="csv-import" className="btn btn-secondary cursor-pointer">
            {isImporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            Import CSV
          </label>
          <input
            id="csv-import"
            type="file"
            accept=".csv"
            onChange={handleCSVImport}
            className="sr-only"
            disabled={isImporting}
          />

          {/* Add New */}
          <button
            onClick={() => setIsAdding(true)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            Add New
          </button>
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-green-400">
            Imported: {importResult.imported}, Skipped: {importResult.skipped}
          </p>
          {importResult.errors.length > 0 && (
            <ul className="mt-2 text-sm text-red-400">
              {importResult.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-nihongo-text-muted" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vocabulary..."
            className="input pl-10"
          />
        </div>
        <button type="submit" className="btn btn-secondary">
          Search
        </button>
      </form>

      {/* Add New Form */}
      {isAdding && (
        <div className="card animate-slide-up">
          <h3 className="text-lg font-bold mb-4">Add New Vocabulary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Expression (e.g., 食べる)"
              value={newVocab.expression}
              onChange={(e) => setNewVocab({ ...newVocab, expression: e.target.value })}
              className="input japanese-text"
            />
            <input
              type="text"
              placeholder="Reading (e.g., たべる)"
              value={newVocab.reading}
              onChange={(e) => setNewVocab({ ...newVocab, reading: e.target.value })}
              className="input japanese-text"
            />
            <input
              type="text"
              placeholder="Meaning (e.g., to eat)"
              value={newVocab.meaning}
              onChange={(e) => setNewVocab({ ...newVocab, meaning: e.target.value })}
              className="input"
            />
            <input
              type="text"
              placeholder="Tags (e.g., JLPT_N5 Genki_Ln.3)"
              value={newVocab.tags}
              onChange={(e) => setNewVocab({ ...newVocab, tags: e.target.value })}
              className="input"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setIsAdding(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleAddNew} className="btn btn-primary">
              <Save size={16} />
              Save
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-nihongo-primary" />
          </div>
        ) : vocabularies.length === 0 ? (
          <div className="text-center p-12 text-nihongo-text-muted">
            No vocabulary found. Add some or import a CSV file.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-nihongo-bg">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-nihongo-text-muted">Expression</th>
                <th className="text-left p-4 text-sm font-medium text-nihongo-text-muted">Reading</th>
                <th className="text-left p-4 text-sm font-medium text-nihongo-text-muted">Meaning</th>
                <th className="text-left p-4 text-sm font-medium text-nihongo-text-muted">Tags</th>
                <th className="text-right p-4 text-sm font-medium text-nihongo-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vocabularies.map((vocab) => (
                <tr key={vocab.id} className="border-t border-nihongo-border hover:bg-nihongo-bg/50">
                  {editingId === vocab.id && editingData ? (
                    <>
                      <td className="p-2">
                        <input
                          type="text"
                          value={editingData.expression}
                          onChange={(e) => setEditingData({ ...editingData, expression: e.target.value })}
                          className="input py-2 japanese-text"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={editingData.reading}
                          onChange={(e) => setEditingData({ ...editingData, reading: e.target.value })}
                          className="input py-2 japanese-text"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={editingData.meaning}
                          onChange={(e) => setEditingData({ ...editingData, meaning: e.target.value })}
                          className="input py-2"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={editingData.tags}
                          onChange={(e) => setEditingData({ ...editingData, tags: e.target.value })}
                          className="input py-2"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={handleSaveEdit} className="p-2 text-green-500 hover:bg-green-500/10 rounded">
                            <Save size={16} />
                          </button>
                          <button onClick={handleCancelEdit} className="p-2 text-nihongo-text-muted hover:bg-nihongo-bg rounded">
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4 japanese-text text-lg">{vocab.expression}</td>
                      <td className="p-4 japanese-text text-nihongo-text-muted">{vocab.reading}</td>
                      <td className="p-4">{vocab.meaning}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {vocab.tags?.split(' ').filter(Boolean).map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 text-xs bg-nihongo-primary/20 text-nihongo-primary rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(vocab)}
                            className="p-2 text-nihongo-text-muted hover:text-nihongo-primary hover:bg-nihongo-primary/10 rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(vocab.id)}
                            className="p-2 text-nihongo-text-muted hover:text-nihongo-accent hover:bg-nihongo-accent/10 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-nihongo-text-muted">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-secondary disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-secondary disabled:opacity-50"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


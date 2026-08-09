'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Asset } from '@/backend/types';

interface AssetFormProps {
  assets: Asset[];
  onSuccess: (asset: Asset) => void;
  onCancel: () => void;
  showToast: (type: 'success' | 'danger', text: string) => void;
}

export const AssetForm: React.FC<AssetFormProps> = ({ assets, onSuccess, onCancel, showToast }) => {
  const [tipo, setTipo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [papel, setPapel] = useState('');
  const [relatorios, setRelatorios] = useState('Não');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const uniqueTipos = Array.from(new Set(assets.map(a => a.Tipo).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'pt-BR')
  );

  const uniqueCategorias = Array.from(new Set(assets.map(a => a.Categoria).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'pt-BR')
  );

  const generatedLink = categoria && papel
    ? `https://statusinvest.com.br/${categoria.toLowerCase().replace(/\s+/g, '')}/${papel.trim().toLowerCase()}`
    : '';

  useEffect(() => {
    if (categoria || papel) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [categoria, papel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!tipo || !categoria || !papel) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('/api/assets', {
        Tipo: tipo,
        Categoria: categoria,
        Papel: papel,
        Relatorios: relatorios
      });

      if (res.data.success) {
        showToast('success', `Ativo ${res.data.data.Papel} cadastrado com sucesso!`);
        onSuccess(res.data.data);
        resetForm();
      } else {
        setError(res.data.error || 'Erro ao cadastrar ativo.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao cadastrar ativo.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTipo('');
    setCategoria('');
    setPapel('');
    setRelatorios('Não');
    setError('');
  };

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h5 mb-0 text-primary fw-bold">
            <i className="bi bi-plus-circle me-2"></i>Cadastrar Novo Ativo
          </h2>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            <i className="bi bi-x-lg me-1"></i>Fechar
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger py-2 mb-3" role="alert">
              {error}
            </div>
          )}

          <div className="row g-3">
            <div className="col-md-3">
              <label htmlFor="tipo" className="form-label fw-semibold small text-uppercase text-muted">
                Tipo <span className="text-danger">*</span>
              </label>
              <select
                id="tipo"
                className="form-select"
                value={tipo}
                onChange={e => setTipo(e.target.value)}
                disabled={loading}
                required
              >
                <option value="">Selecione...</option>
                {uniqueTipos.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label htmlFor="categoria" className="form-label fw-semibold small text-uppercase text-muted">
                Categoria <span className="text-danger">*</span>
              </label>
              <select
                id="categoria"
                className="form-select"
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                disabled={loading}
                required
              >
                <option value="">Selecione...</option>
                {uniqueCategorias.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label htmlFor="papel" className="form-label fw-semibold small text-uppercase text-muted">
                Papel <span className="text-danger">*</span>
              </label>
              <input
                id="papel"
                type="text"
                className="form-control"
                value={papel}
                onChange={e => setPapel(e.target.value)}
                disabled={loading}
                placeholder="Ex: PETR4"
                required
              />
            </div>

            <div className="col-md-3">
              <label htmlFor="relatorios" className="form-label fw-semibold small text-uppercase text-muted">
                Relatórios <span className="text-danger">*</span>
              </label>
              <select
                id="relatorios"
                className="form-select"
                value={relatorios}
                onChange={e => setRelatorios(e.target.value)}
                disabled={loading}
                required
              >
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
              </select>
            </div>
          </div>

          <div className="row g-3 mt-0">
            <div className="col-12">
              <label htmlFor="link" className="form-label fw-semibold small text-uppercase text-muted">
                Link (automático)
              </label>
              <input
                id="link"
                type="text"
                className="form-control font-monospace small"
                value={generatedLink}
                readOnly
                placeholder="Selecione Categoria e digite o Papel para gerar o link"
              />
              <div className="form-text text-muted small">
                Gerado automaticamente a partir de Categoria e Papel.
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-3">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary d-flex align-items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Salvando...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg"></i>
                  Cadastrar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

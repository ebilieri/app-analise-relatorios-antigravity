'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';

export default function AnalisePage() {
  const params = useParams();
  const papel = typeof params.papel === 'string' ? params.papel.toUpperCase() : '';
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!papel) return;

    const fetchPrompt = async () => {
      try {
        const res = await axios.get(`/api/analise/${papel}`);
        if (res.data.success) {
          setPrompt(res.data.data.prompt);
        } else {
          setError(res.data.error || 'Erro ao carregar análise.');
        }
      } catch (err: any) {
        const msg = err.response?.data?.error || 'Erro ao carregar análise.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchPrompt();
  }, [papel]);

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="h4 mb-0 text-primary fw-bold">
            <i className="bi bi-robot me-2"></i>Análise com IA — {papel}
          </h1>
          <a
            href="/"
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
          >
            <i className="bi bi-arrow-left"></i>
            Voltar
          </a>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          </div>
        ) : (
          <textarea
            className="form-control font-monospace small"
            value={prompt}
            readOnly
            rows={25}
            style={{ resize: 'vertical' }}
          />
        )}
      </div>
    </div>
  );
}

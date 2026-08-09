'use client';

import React from 'react';

interface ControlPanelProps {
  onSyncExcel: () => void;
  onUpdateQuotes: () => void;
  onUpdateReports: () => void;
  onDownloadReports: () => void;
  loadingOp: string | null;
  progressText: string;
  selectedCount: number;
  totalAssets: number;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onSyncExcel,
  onUpdateQuotes,
  onUpdateReports,
  onDownloadReports,
  loadingOp,
  progressText,
  selectedCount,
  totalAssets,
}) => {
  const isBusy = Boolean(loadingOp);

  return (
    <div className="card shadow-sm border-0 mb-4 bg-body-tertiary">
      <div className="card-body p-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h1 className="h3 mb-1 text-primary fw-bold">
              <i className="bi bi-graph-up-arrow me-2"></i>Análise de Ativos Financeiros
            </h1>
            <p className="text-muted small mb-0">
              Total de ativos: <span className="fw-bold text-dark">{totalAssets}</span> | Relatórios selecionados para download: <span className="badge bg-primary fs-6">{selectedCount}</span>
            </p>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-outline-secondary d-flex align-items-center gap-2"
              onClick={onSyncExcel}
              disabled={isBusy}
              title="Reler planilha Excel base e sincronizar ativos"
            >
              {loadingOp === 'sync' ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : (
                <i className="bi bi-file-earmark-spreadsheet"></i>
              )}
              Atualizar Dados
            </button>

            <button
              className="btn btn-outline-primary d-flex align-items-center gap-2"
              onClick={onUpdateQuotes}
              disabled={isBusy}
              title="Buscar cotações atuais no StatusInvest (linha por linha)"
            >
              {loadingOp === 'quotes' ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : (
                <i className="bi bi-currency-dollar"></i>
              )}
              Atualizar Cotação
            </button>

            <button
              className="btn btn-outline-info d-flex align-items-center gap-2 text-dark fw-medium"
              onClick={onUpdateReports}
              disabled={isBusy}
              title="Buscar links e datas dos últimos relatórios no StatusInvest"
            >
              {loadingOp === 'reports' ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : (
                <i className="bi bi-file-earmark-pdf"></i>
              )}
              Atualizar Relatórios
            </button>

            <button
              className="btn btn-success d-flex align-items-center gap-2"
              onClick={onDownloadReports}
              disabled={isBusy || selectedCount === 0}
              title="Baixar PDFs dos relatórios selecionados"
            >
              {loadingOp === 'download' ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : (
                <i className="bi bi-download"></i>
              )}
              Baixar Relatórios ({selectedCount})
            </button>
          </div>
        </div>

        {progressText && (
          <div className="alert alert-info mt-3 mb-0 d-flex align-items-center gap-3 py-2 px-3 shadow-sm border-info-subtle">
            <span className="spinner-border spinner-border-sm text-info flex-shrink-0" role="status"></span>
            <div className="flex-grow-1 font-monospace small">{progressText}</div>
          </div>
        )}
      </div>
    </div>
  );
};

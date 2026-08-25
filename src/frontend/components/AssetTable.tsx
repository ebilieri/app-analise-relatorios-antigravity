'use client';

import React from 'react';
import { Asset } from '@/backend/types';

interface AssetTableProps {
  assets: Asset[];
  selectedMap: Record<string, boolean>;
  onToggleSelect: (papel: string) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onEditAsset: (asset: Asset) => void;
  processingPapel: string | null;
}

const TIPO_COLOR_MAP: Record<string, string> = {
  ETF: '#c1e4f2',
  FIAGRO: '#f5f5b4',
  INFRA: '#b3def5',
  PAPEL: '#b3f5b5',
  VENDA: '#f5b3d2',
  TIJOLO: '#bda7b1',
};

export const AssetTable: React.FC<AssetTableProps> = ({
  assets,
  selectedMap,
  onToggleSelect,
  onToggleSelectAll,
  onEditAsset,
  processingPapel,
}) => {
  // Apenas ativos com relatório disponível e que AINDA NÃO foram baixados são elegíveis para seleção
  const eligibleForDownload = assets.filter(
    a => a.Relatorios === 'Sim' && Boolean(a['Data Ultimo Relatorio']) && !a.baixado
  );

  const allEligibleSelected =
    eligibleForDownload.length > 0 &&
    eligibleForDownload.every(a => selectedMap[a.Papel]);

  const isSomeSelected =
    eligibleForDownload.some(a => selectedMap[a.Papel]) && !allEligibleSelected;

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-striped-columns table-hover align-middle mb-0 text-nowrap">
            <thead className="table-dark">
              <tr>
                <th style={{ width: '40px' }} className="text-center">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={allEligibleSelected}
                    ref={input => {
                      if (input) input.indeterminate = isSomeSelected;
                    }}
                    onChange={e => onToggleSelectAll(e.target.checked)}
                    disabled={eligibleForDownload.length === 0}
                    title="Marcar / Desmarcar Todos os Relatórios Pendentes"
                  />
                </th>
                <th>Tipo</th>
                <th>Papel</th>
                <th>Categoria</th>
                <th>Valor Atual</th>
                <th>Min. 52 Semanas</th>
                <th>Max. 52 Semanas</th>
                <th className="text-center">Relatórios</th>
                <th>Data Últ. Relatório</th>
                <th className="text-center">Ações / Download</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-4 text-muted">
                    Nenhum ativo carregado.
                  </td>
                </tr>
              ) : (
                assets.map(asset => {
                  const hasReport =
                    asset.Relatorios === 'Sim' && Boolean(asset['Data Ultimo Relatorio']);
                  const isPendingDownload = hasReport && !asset.baixado;
                  const isChecked = Boolean(selectedMap[asset.Papel]);
                  const isProcessing = processingPapel === asset.Papel;
                  const bgTipo = TIPO_COLOR_MAP[asset.Tipo.toUpperCase()] || '#6c757d';

                  return (
                    <tr
                      key={asset.Papel}
                      className={isProcessing ? 'table-warning' : undefined}
                    >
                      <td className="text-center">
                        {isPendingDownload ? (
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={isChecked}
                            onChange={() => onToggleSelect(asset.Papel)}
                            disabled={Boolean(processingPapel)}
                            title="Selecionar para download"
                          />
                        ) : asset.baixado ? (
                          <input
                            type="checkbox"
                            className="form-check-input opacity-50"
                            disabled
                            checked={false}
                            title="Relatório já baixado localmente"
                          />
                        ) : (
                          <span className="text-muted small">-</span>
                        )}
                      </td>

                      <td>
                        <span
                          className="badge font-monospace text-dark border shadow-sm"
                          style={{ backgroundColor: bgTipo }}
                        >
                          {asset.Tipo}
                        </span>
                      </td>

                      <td>
                        <a
                          href={asset['Link Cotacao']}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="fw-bold text-decoration-none text-primary"
                          title={`Ver ${asset.Papel} no StatusInvest`}
                        >
                          {asset.Papel} <i className="bi bi-box-arrow-up-right small"></i>
                        </a>
                      </td>

                      <td>
                        <span className="text-muted small">{asset.Categoria}</span>
                      </td>

                      <td className="fw-semibold text-dark">
                        {isProcessing ? (
                          <span className="spinner-border spinner-border-sm text-warning ms-1" role="status"></span>
                        ) : asset['Valor Atual'] ? (
                          `R$ ${asset['Valor Atual']}`
                        ) : (
                          <span className="text-muted font-monospace">-</span>
                        )}
                      </td>

                      <td className="text-muted">
                        {asset['Minima 52 Semanas'] ? `R$ ${asset['Minima 52 Semanas']}` : '-'}
                      </td>

                      <td className="text-muted">
                        {asset['Maxima 52 Semanas'] ? `R$ ${asset['Maxima 52 Semanas']}` : '-'}
                      </td>

                      <td className="text-center">
                        {asset.Relatorios === 'Sim' ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            Sim
                          </span>
                        ) : (
                          <span className="badge bg-light text-muted border">Não</span>
                        )}
                      </td>

                      <td>
                        {asset['Data Ultimo Relatorio'] ? (
                          <span className="font-monospace small">
                            <i className="bi bi-calendar-event me-1 text-muted"></i>
                            {asset['Data Ultimo Relatorio']}
                          </span>
                        ) : (
                          <span className="text-muted small">-</span>
                        )}
                      </td>

                      <td className="text-center">
                        <div className="d-flex align-items-center justify-content-center gap-2">
                          {isProcessing && (
                            <span
                              className="spinner-border spinner-border-sm text-primary"
                              role="status"
                              aria-hidden="true"
                            ></span>
                          )}

                          {asset['Link Download PDF'] ? (
                            <a
                              href={asset['Link Download PDF']}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                              title="Abrir PDF original (StatusInvest / B3)"
                            >
                              <i className="bi bi-file-pdf"></i>
                              PDF Web
                            </a>
                          ) : null}

                           {asset.baixado && asset.caminhoRelatorioLocal ? (
                             <a
                               href={asset.caminhoRelatorioLocal}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="btn btn-sm btn-success d-inline-flex align-items-center gap-1 text-decoration-none shadow-sm"
                               title="Abrir relatório PDF salvo no computador"
                             >
                               <i className="bi bi-file-earmark-check-fill"></i>
                               Baixado <i className="bi bi-box-arrow-up-right small"></i>
                             </a>
                           ) : isPendingDownload ? (
                             <span className="badge bg-warning text-dark border border-warning-subtle py-2 px-2">
                               Pendente
                             </span>
                           ) : null}

                           {asset.baixado && asset.caminhoRelatorioLocal ? (
                             <a
                               href={`/analise/${asset.Papel}`}
                               className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                               title="Analisar relatório com IA"
                             >
                               <i className="bi bi-robot"></i>
                               Analise
                             </a>
                           ) : null}

                           <button
                             type="button"
                             className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                             onClick={() => onEditAsset(asset)}
                             disabled={Boolean(processingPapel)}
                             title={`Editar ativo ${asset.Papel}`}
                           >
                             <i className="bi bi-pencil-square"></i>
                             Editar
                           </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

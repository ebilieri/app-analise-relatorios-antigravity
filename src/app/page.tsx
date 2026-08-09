'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Asset } from '@/backend/types';
import { ControlPanel } from '@/frontend/components/ControlPanel';
import { AssetTable } from '@/frontend/components/AssetTable';
import { AssetForm } from '@/frontend/components/AssetForm';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});
  const [loadingOp, setLoadingOp] = useState<string | null>(null);
  const [processingPapel, setProcessingPapel] = useState<string | null>(null);
  const [progressText, setProgressText] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Carrega os ativos iniciais
  const fetchAssets = async () => {
    try {
      setLoadingOp('fetch');
      const res = await axios.get('/api/assets');
      if (res.data.success) {
        const loaded: Asset[] = res.data.data;
        setAssets(loaded);

        // Preenche seleção padrão apenas para os relatórios elegíveis que AINDA NÃO foram baixados
        const initialSelected: Record<string, boolean> = {};
        loaded.forEach(a => {
          if (a.Relatorios === 'Sim' && a['Data Ultimo Relatorio'] && !a.baixado) {
            initialSelected[a.Papel] = true;
          }
        });
        setSelectedMap(initialSelected);
      }
    } catch (err) {
      console.error('Erro ao carregar ativos:', err);
      showToast('danger', 'Erro ao carregar os dados dos ativos.');
    } finally {
      setLoadingOp(null);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchAssets();
  }, []);

  const showToast = (type: 'success' | 'danger', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  };

  // Alterna checkbox individual
  const handleToggleSelect = (papel: string) => {
    setSelectedMap(prev => ({
      ...prev,
      [papel]: !prev[papel]
    }));
  };

  // Selecionar / Deselecionar Todos os relatórios pendentes
  const handleToggleSelectAll = (checked: boolean) => {
    const updated: Record<string, boolean> = { ...selectedMap };
    assets.forEach(a => {
      if (a.Relatorios === 'Sim' && a['Data Ultimo Relatorio'] && !a.baixado) {
        updated[a.Papel] = checked;
      }
    });
    setSelectedMap(updated);
  };

  // 1. Atualizar Dados (Excel -> JSON)
  const handleSyncExcel = async () => {
    try {
      setLoadingOp('sync');
      setProgressText('Lendo planilha Excel base e sincronizando dados...');
      const res = await axios.post('/api/sync-excel');
      if (res.data.success) {
        setAssets(res.data.data);
        showToast('success', 'Dados do Excel sincronizados com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao sincronizar Excel:', err);
      showToast('danger', 'Falha ao sincronizar dados com a planilha Excel.');
    } finally {
      setLoadingOp(null);
      setProgressText('');
    }
  };

  // 2. Atualizar Cotações (Sequencial, linha por linha)
  const handleUpdateQuotes = async () => {
    if (assets.length === 0) return;
    setLoadingOp('quotes');

    try {
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        setProcessingPapel(asset.Papel);
        setProgressText(`[${i + 1}/${assets.length}] Atualizando cotação de ${asset.Papel}...`);

        try {
          const res = await axios.post('/api/scrape-quote', {
            papel: asset.Papel,
            link: asset.Link
          });

          if (res.data.success && res.data.data) {
            const updatedAsset: Asset = res.data.data;
            setAssets(prev =>
              prev.map(a => (a.Papel === updatedAsset.Papel ? updatedAsset : a))
            );
          }
        } catch (itemErr) {
          console.warn(`Erro ao buscar cotação de ${asset.Papel}:`, itemErr);
        }
      }

      showToast('success', 'Todas as cotações foram atualizadas!');
    } catch (err) {
      console.error('Erro no lote de cotações:', err);
      showToast('danger', 'Ocorreu um erro durante a atualização de cotações.');
    } finally {
      setProcessingPapel(null);
      setLoadingOp(null);
      setProgressText('');
    }
  };

  // 3. Atualizar Relatórios (Sequencial, linha por linha)
  const handleUpdateReports = async () => {
    const reportEligible = assets.filter(a => a.Relatorios === 'Sim');
    if (reportEligible.length === 0) {
      showToast('danger', 'Nenhum ativo marcado com "Relatorios = Sim".');
      return;
    }

    setLoadingOp('reports');

    try {
      for (let i = 0; i < reportEligible.length; i++) {
        const asset = reportEligible[i];
        setProcessingPapel(asset.Papel);
        setProgressText(`[${i + 1}/${reportEligible.length}] Buscando último relatório de ${asset.Papel}...`);

        try {
          const res = await axios.post('/api/scrape-report', {
            papel: asset.Papel,
            link: asset.Link
          });

          if (res.data.success && res.data.data) {
            const updatedAsset: Asset = res.data.data;
            setAssets(prev =>
              prev.map(a => (a.Papel === updatedAsset.Papel ? updatedAsset : a))
            );

            // Se o relatório foi encontrado e ainda não foi baixado, marca a seleção
            if (updatedAsset['Data Ultimo Relatorio'] && !updatedAsset.baixado) {
              setSelectedMap(prev => ({ ...prev, [updatedAsset.Papel]: true }));
            }
          }
        } catch (itemErr) {
          console.warn(`Erro ao buscar relatório de ${asset.Papel}:`, itemErr);
        }
      }

      showToast('success', 'Busca de relatórios concluída!');
    } catch (err) {
      console.error('Erro no lote de relatórios:', err);
      showToast('danger', 'Ocorreu um erro durante a atualização de relatórios.');
    } finally {
      setProcessingPapel(null);
      setLoadingOp(null);
      setProgressText('');
    }
  };

  // 4. Baixar Relatórios (Sequencial, linha por linha)
  const handleDownloadReports = async () => {
    const selectedAssets = assets.filter(
      a => selectedMap[a.Papel] && a['Link Relatorio'] && !a.baixado
    );

    if (selectedAssets.length === 0) {
      showToast('danger', 'Selecione ao menos um ativo pendente com Link de Relatório para download.');
      return;
    }

    setLoadingOp('download');

    try {
      for (let i = 0; i < selectedAssets.length; i++) {
        const asset = selectedAssets[i];
        setProcessingPapel(asset.Papel);
        setProgressText(`[${i + 1}/${selectedAssets.length}] Baixando PDF do relatório de ${asset.Papel}...`);

        try {
          const res = await axios.post('/api/download-report', {
            papel: asset.Papel,
            dataUltimoRelatorio: asset['Data Ultimo Relatorio'],
            linkRelatorio: asset['Link Relatorio']
          });

          if (res.data.success && res.data.data) {
            const updatedAsset: Asset = res.data.data;

            setAssets(prev =>
              prev.map(a => (a.Papel === updatedAsset.Papel ? updatedAsset : a))
            );

            setSelectedMap(prev => ({
              ...prev,
              [updatedAsset.Papel]: false
            }));
          }
        } catch (itemErr) {
          console.warn(`Erro ao baixar relatório de ${asset.Papel}:`, itemErr);
        }
      }

      showToast('success', 'Download dos relatórios concluído com sucesso!');
    } catch (err) {
      console.error('Erro no download em lote:', err);
      showToast('danger', 'Ocorreu um erro durante o download dos relatórios.');
    } finally {
      setProcessingPapel(null);
      setLoadingOp(null);
      setProgressText('');
    }
  };

  const selectedCount = Object.keys(selectedMap).filter(
    k => selectedMap[k] && assets.some(a => a.Papel === k && a['Link Relatorio'] && !a.baixado)
  ).length;

  // Previne Hydration Mismatch caso a renderização inicial do cliente difira do SSR
  if (!mounted) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {toastMessage && (
        <div
          className={`alert alert-${toastMessage.type} alert-dismissible fade show mb-3 shadow-sm`}
          role="alert"
        >
          {toastMessage.type === 'success' ? (
            <i className="bi bi-check-circle-fill me-2"></i>
          ) : (
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
          )}
          {toastMessage.text}
          <button
            type="button"
            className="btn-close"
            onClick={() => setToastMessage(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      <ControlPanel
        onSyncExcel={handleSyncExcel}
        onUpdateQuotes={handleUpdateQuotes}
        onUpdateReports={handleUpdateReports}
        onDownloadReports={handleDownloadReports}
        loadingOp={loadingOp}
        progressText={progressText}
        selectedCount={selectedCount}
        totalAssets={assets.length}
        showForm={showForm}
        onToggleForm={() => setShowForm(prev => !prev)}
      />

      {showForm ? (
        <AssetForm
          assets={assets}
          onSuccess={(asset) => {
            setAssets(prev => [...prev, asset]);
          }}
          onCancel={() => setShowForm(false)}
          showToast={showToast}
        />
      ) : (
        <AssetTable
          assets={assets}
          selectedMap={selectedMap}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          processingPapel={processingPapel}
        />
      )}
    </div>
  );
}

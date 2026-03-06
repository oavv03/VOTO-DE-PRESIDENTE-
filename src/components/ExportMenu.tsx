import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Settings2, Check, X, BarChart } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { cn } from '../lib/utils';
import { Chart as ChartJS } from 'chart.js/auto';

interface ExportMenuProps {
  province: string;
  summary: any;
  data: any;
  circuit?: string;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ province, summary, data, circuit }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [config, setConfig] = useState({
    includeSummary: true,
    includeCircuits: !circuit,
    includeCandidates: true,
    includeCharts: true,
  });

  const generateChartImage = async (labels: string[], values: number[], title: string): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const chart = new ChartJS(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: title,
          data: values,
          backgroundColor: '#0055aa',
          borderRadius: 4,
        }]
      },
      options: {
        responsive: false,
        animation: { duration: 0 },
        plugins: {
          legend: { display: false },
          title: { display: true, text: title, font: { size: 16 } }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });

    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 100));
    const imgData = canvas.toDataURL('image/png');
    chart.destroy();
    return imgData;
  };

  const exportToExcel = () => {
    setIsExporting(true);
    const wb = XLSX.utils.book_new();
    
    if (config.includeSummary) {
      const summaryData = [
        [circuit ? `INFORME ELECTORAL 2024 - CIRCUITO ${circuit}` : 'INFORME ELECTORAL 2024'],
        ['Provincia', province],
        circuit ? ['Circuito', circuit] : [''],
        [''],
        ['Categoría', 'Valor'],
        ['Centros', summary.cen],
        ['Mesas', summary.mes],
        ['Padrón Electoral', summary.pad],
        ['Votos Válidos', summary.val],
        ['Participación', `${summary.part}%`],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');
    }

    if (config.includeCircuits && !circuit) {
      const circuitsData: any[] = [['DETALLE POR CIRCUITOS'], [''], ['Circuito', 'Centros', 'Mesas', 'Padrón', 'Válidos', 'Participación']];
      Object.entries(data).forEach(([circ, c]: [string, any]) => {
        circuitsData.push([
          circ,
          c.tec.cen,
          c.tec.mes,
          c.tec.pad,
          c.tec.val,
          `${((c.tec.emi / c.tec.pad) * 100).toFixed(2)}%`
        ]);
      });
      const wsCircuits = XLSX.utils.aoa_to_sheet(circuitsData);
      XLSX.utils.book_append_sheet(wb, wsCircuits, 'Circuitos');
    }

    if (config.includeCandidates) {
      const candidatesData: any[] = [['VOTOS POR CANDIDATO'], [''], ['Circuito', 'Candidato', 'Votos']];
      if (circuit) {
        Object.entries(data.cand).forEach(([cand, votes]: [string, any]) => {
          candidatesData.push([circuit, cand, votes]);
        });
      } else {
        Object.entries(data).forEach(([circ, c]: [string, any]) => {
          Object.entries(c.cand).forEach(([cand, votes]: [string, any]) => {
            candidatesData.push([circ, cand, votes]);
          });
        });
      }
      const wsCandidates = XLSX.utils.aoa_to_sheet(candidatesData);
      XLSX.utils.book_append_sheet(wb, wsCandidates, 'Candidatos');
    }

    const fileName = circuit 
      ? `Informe_Electoral_${province.replace(/\s/g, '_')}_Circuito_${circuit.replace(/\s/g, '_')}.xlsx`
      : `Informe_Electoral_${province.replace(/\s/g, '_')}.xlsx`;
    
    XLSX.writeFile(wb, fileName);
    setIsExporting(false);
    setShowOptions(false);
  };

  const getLogoBase64 = async (url: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve('');
        }
      };
      img.onerror = () => resolve('');
      img.src = url;
    });
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    const doc = new jsPDF();
    let yPos = 20;

    // Header
    doc.setFillColor(0, 51, 102);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Add Logo using a proxy to avoid CORS issues
    const logoUrl = 'https://images.weserv.nl/?url=plagel2024.com/wp-content/uploads/2023/02/logo-plagel-2022.webp&w=300&h=300&fit=cover&mask=circle&output=png';
    const logoBase64 = await getLogoBase64(logoUrl);
    if (logoBase64) {
      // Position logo on the left
      doc.addImage(logoBase64, 'PNG', 10, 5, 30, 30);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('Centro de estadística electoral', 115, 18, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`Provincia: ${province}`, 115, 26, { align: 'center' });
    if (circuit) {
      doc.text(`Circuito: ${circuit}`, 115, 34, { align: 'center' });
    }
    
    yPos = 50;
    doc.setTextColor(0, 0, 0);

    if (config.includeSummary) {
      doc.setFontSize(16);
      doc.text(circuit ? `1. Resumen Circuito ${circuit}` : '1. Resumen Provincial', 14, yPos);
      yPos += 10;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Categoría', 'Valor']],
        body: [
          ['Centros de Votación', summary.cen.toLocaleString()],
          ['Mesas de Votación', summary.mes.toLocaleString()],
          ['Padrón Electoral', summary.pad.toLocaleString()],
          ['Votos Válidos', summary.val.toLocaleString()],
          ['Participación Ciudadana', `${summary.part}%`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [0, 51, 102] }
      });
      yPos = (doc as any).lastAutoTable.finalY + 20;
    }

    if (config.includeCharts) {
      if (yPos > 180) { doc.addPage(); yPos = 20; }
      doc.setFontSize(16);
      doc.text('2. Análisis Gráfico', 14, yPos);
      yPos += 10;

      // Consolidate candidates for the chart
      const consolidatedCandidates: Record<string, number> = {};
      if (circuit) {
        Object.entries(data.cand).forEach(([cand, votes]: [string, any]) => {
          consolidatedCandidates[cand] = votes;
        });
      } else {
        Object.values(data).forEach((c: any) => {
          Object.entries(c.cand).forEach(([cand, votes]: [string, any]) => {
            consolidatedCandidates[cand] = (consolidatedCandidates[cand] || 0) + votes;
          });
        });
      }

      const sortedCands = Object.entries(consolidatedCandidates).sort((a, b) => b[1] - a[1]);
      const labels = sortedCands.map(c => c[0]);
      const values = sortedCands.map(c => c[1]);

      const chartImg = await generateChartImage(labels, values, circuit ? `Votos Circuito ${circuit}` : 'Votos Consolidados por Candidato');
      if (chartImg) {
        doc.addImage(chartImg, 'PNG', 15, yPos, 180, 90);
        yPos += 100;
      }
    }

    if (config.includeCircuits && !circuit) {
      if (yPos > 220) { doc.addPage(); yPos = 20; }
      doc.setFontSize(16);
      doc.text('3. Detalle por Circuitos', 14, yPos);
      yPos += 10;

      const circuitRows = Object.entries(data).map(([circ, c]: [string, any]) => [
        circ,
        c.tec.cen.toLocaleString(),
        c.tec.mes.toLocaleString(),
        c.tec.pad.toLocaleString(),
        c.tec.val.toLocaleString(),
        `${((c.tec.emi / c.tec.pad) * 100).toFixed(2)}%`
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Circuito', 'Centros', 'Mesas', 'Padrón', 'Válidos', 'Part.']],
        body: circuitRows,
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102] }
      });
      yPos = (doc as any).lastAutoTable.finalY + 20;
    }

    if (config.includeCandidates) {
      if (yPos > 220) { doc.addPage(); yPos = 20; }
      doc.setFontSize(16);
      doc.text(circuit ? '3. Resultados por Candidato' : '4. Resultados por Candidato', 14, yPos);
      yPos += 10;

      const consolidatedCandidates: Record<string, number> = {};
      if (circuit) {
        Object.entries(data.cand).forEach(([cand, votes]: [string, any]) => {
          consolidatedCandidates[cand] = votes;
        });
      } else {
        Object.values(data).forEach((c: any) => {
          Object.entries(c.cand).forEach(([cand, votes]: [string, any]) => {
            consolidatedCandidates[cand] = (consolidatedCandidates[cand] || 0) + votes;
          });
        });
      }

      const candidateRows = Object.entries(consolidatedCandidates)
        .sort((a, b) => b[1] - a[1])
        .map(([cand, votes]) => [cand, votes.toLocaleString()]);

      autoTable(doc, {
        startY: yPos,
        head: [['Candidato', 'Votos Totales']],
        body: candidateRows,
        theme: 'striped',
        headStyles: { fillColor: [0, 51, 102] }
      });
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(`Centro de estadística electoral - Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
    }

    const fileName = circuit 
      ? `Informe_Electoral_${province.replace(/\s/g, '_')}_Circuito_${circuit.replace(/\s/g, '_')}.pdf`
      : `Informe_Electoral_${province.replace(/\s/g, '_')}.pdf`;
    
    doc.save(fileName);
    setIsExporting(false);
    setShowOptions(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold text-sm shadow-md"
      >
        <Download size={16} />
        Exportar Informe
      </button>

      {showOptions && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <Settings2 size={16} /> Personalizar Informe
            </h4>
            <button onClick={() => setShowOptions(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-2 mb-6">
            <button
              onClick={() => setConfig(prev => ({ ...prev, includeSummary: !prev.includeSummary }))}
              className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <span className="text-gray-700">{circuit ? 'Resumen de Circuito' : 'Resumen Provincial'}</span>
              <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", config.includeSummary ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300")}>
                {config.includeSummary && <Check size={14} />}
              </div>
            </button>

            <button
              onClick={() => setConfig(prev => ({ ...prev, includeCharts: !prev.includeCharts }))}
              className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <span className="text-gray-700 font-medium text-blue-700 flex items-center gap-2">
                <BarChart size={14} /> Incluir Gráficas (PDF)
              </span>
              <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", config.includeCharts ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300")}>
                {config.includeCharts && <Check size={14} />}
              </div>
            </button>

            {!circuit && (
              <button
                onClick={() => setConfig(prev => ({ ...prev, includeCircuits: !prev.includeCircuits }))}
                className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <span className="text-gray-700">Detalle de Circuitos</span>
                <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", config.includeCircuits ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300")}>
                  {config.includeCircuits && <Check size={14} />}
                </div>
              </button>
            )}

            <button
              onClick={() => setConfig(prev => ({ ...prev, includeCandidates: !prev.includeCandidates }))}
              className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <span className="text-gray-700">Votos por Candidato</span>
              <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", config.includeCandidates ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300")}>
                {config.includeCandidates && <Check size={14} />}
              </div>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={isExporting}
              onClick={exportToExcel}
              className="flex items-center justify-center gap-2 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-bold text-xs disabled:opacity-50"
            >
              <FileSpreadsheet size={14} /> Excel
            </button>
            <button
              disabled={isExporting}
              onClick={exportToPDF}
              className="flex items-center justify-center gap-2 p-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-bold text-xs disabled:opacity-50"
            >
              <FileText size={14} /> {isExporting ? 'Generando...' : 'PDF'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


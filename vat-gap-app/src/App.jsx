import React, { useState } from 'react';
import { Upload, Download, CheckCircle, AlertCircle, TrendingUp, Database, FileSpreadsheet, BarChart3, Globe, Zap, FileText } from 'lucide-react';

const VATGapDataOptimizer = () => {
  const [activeTab, setActiveTab] = useState('import');
  const [rawData, setRawData] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [transformedData, setTransformedData] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Procesare reală fișier CSV
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        // Parse CSV
        const headers = lines[0].split(',').map(h => h.trim());
        const rows = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          const row = {};
          headers.forEach((header, index) => {
            const value = values[index]?.trim();
            row[header] = isNaN(value) ? value : parseFloat(value);
          });
          rows.push(row);
        }
        
        setRawData({
          filename: file.name,
          size: file.size,
          headers: headers,
          rowCount: rows.length,
          data: rows
        });
        
        setParsedData(rows);
        
        // Auto-validare
        performRealValidation(rows, headers);
        
      } catch (error) {
        alert('Eroare la procesarea fișierului: ' + error.message);
      } finally {
        setIsProcessing(false);
      }
    };
    
    reader.readAsText(file);
  };

  // Validare reală a datelor
  const performRealValidation = (data, headers) => {
    const numericColumns = headers.filter(h => 
      data.length > 0 && typeof data[0][h] === 'number'
    );
    
    const results = {
      overall: 'good',
      checks: [],
      recommendations: [],
      stats: {}
    };

    // Check valori lipsă
    numericColumns.forEach(col => {
      const missing = data.filter(row => 
        row[col] === null || row[col] === undefined || isNaN(row[col])
      ).length;
      const missingPct = (missing / data.length * 100).toFixed(1);
      
      results.stats[col] = { missing: missingPct };
      
      if (missing > 0) {
        results.checks.push({
          name: `Valori lipsă: ${col}`,
          status: missingPct > 5 ? 'warning' : 'pass',
          details: `${missingPct}% valori lipsă (${missing}/${data.length})`
        });
        
        if (missingPct > 5) {
          results.recommendations.push(`Atenție la ${col}: ${missingPct}% valori lipsă`);
          results.overall = 'warning';
        }
      }
    });

    // Check outlieri (simplificat: > 3 std dev)
    numericColumns.forEach(col => {
      const values = data.map(row => row[col]).filter(v => !isNaN(v));
      if (values.length === 0) return;
      
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = Math.sqrt(
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
      );
      
      const outliers = values.filter(v => Math.abs(v - mean) > 3 * std);
      
      results.stats[col] = {
        ...results.stats[col],
        mean: mean.toFixed(2),
        std: std.toFixed(2),
        outliers: outliers.length
      };
      
      if (outliers.length > 0) {
        results.checks.push({
          name: `Outlieri: ${col}`,
          status: outliers.length > data.length * 0.05 ? 'warning' : 'info',
          details: `${outliers.length} valori extreme detectate (>${mean.toFixed(1)} ± ${(3*std).toFixed(1)})`
        });
      }
    });

    // Check temporalitate
    const dateColumns = headers.filter(h => 
      h.toLowerCase().includes('date') || 
      h.toLowerCase().includes('year') || 
      h.toLowerCase().includes('period')
    );
    
    if (dateColumns.length > 0) {
      results.checks.push({
        name: 'Consistență temporală',
        status: 'pass',
        details: `Coloană temporală identificată: ${dateColumns[0]}`
      });
    } else {
      results.checks.push({
        name: 'Consistență temporală',
        status: 'warning',
        details: 'Nu s-a identificat coloană temporală'
      });
      results.recommendations.push('Adăugați o coloană cu date/perioade');
    }

    if (results.checks.length === 0) {
      results.checks.push({
        name: 'Validare generală',
        status: 'pass',
        details: 'Dataset valid pentru analiză'
      });
    }

    setValidationResults(results);
  };

  // Transformare reală date
  const performTransformation = () => {
    if (!parsedData) return;
    
    setIsProcessing(true);
    
    try {
      const numericCols = Object.keys(parsedData[0]).filter(key => 
        typeof parsedData[0][key] === 'number'
      );
      
      const transformed = parsedData.map(row => {
        const newRow = { ...row };
        
        // Z-score normalizare pentru fiecare coloană numerică
        numericCols.forEach(col => {
          const values = parsedData.map(r => r[col]).filter(v => !isNaN(v));
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          const std = Math.sqrt(
            values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
          );
          
          if (std > 0 && !isNaN(row[col])) {
            newRow[`${col}_normalized`] = ((row[col] - mean) / std).toFixed(4);
          }
        });
        
        return newRow;
      });
      
      // Adăugare variabile lag
      const laggedData = transformed.map((row, idx) => {
        const newRow = { ...row };
        
        if (idx > 0) {
          numericCols.forEach(col => {
            newRow[`${col}_lag1`] = transformed[idx - 1][col];
          });
        }
        
        if (idx > 1) {
          numericCols.forEach(col => {
            newRow[`${col}_lag2`] = transformed[idx - 2][col];
          });
        }
        
        return newRow;
      });
      
      setTransformedData(laggedData);
      
    } catch (error) {
      alert('Eroare la transformare: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Teste econometrice reale (simplificat)
  const runEconometricTests = () => {
    if (!parsedData) return;
    
    setIsProcessing(true);
    
    try {
      const numericCols = Object.keys(parsedData[0]).filter(key => 
        typeof parsedData[0][key] === 'number'
      );
      
      const tests = {
        descriptive: {},
        correlations: {}
      };
      
      // Statistici descriptive reale
      numericCols.forEach(col => {
        const values = parsedData.map(row => row[col]).filter(v => !isNaN(v));
        if (values.length === 0) return;
        
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const sortedValues = [...values].sort((a, b) => a - b);
        const median = sortedValues[Math.floor(sortedValues.length / 2)];
        const min = Math.min(...values);
        const max = Math.max(...values);
        const std = Math.sqrt(
          values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
        );
        
        tests.descriptive[col] = {
          mean: mean.toFixed(3),
          median: median.toFixed(3),
          std: std.toFixed(3),
          min: min.toFixed(3),
          max: max.toFixed(3),
          count: values.length
        };
      });
      
      // Matrice corelații reală
      for (let i = 0; i < numericCols.length; i++) {
        for (let j = i + 1; j < numericCols.length; j++) {
          const col1 = numericCols[i];
          const col2 = numericCols[j];
          
          const values1 = parsedData.map(row => row[col1]).filter(v => !isNaN(v));
          const values2 = parsedData.map(row => row[col2]).filter(v => !isNaN(v));
          
          if (values1.length !== values2.length) continue;
          
          const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
          const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;
          
          let numerator = 0;
          let denom1 = 0;
          let denom2 = 0;
          
          for (let k = 0; k < values1.length; k++) {
            const diff1 = values1[k] - mean1;
            const diff2 = values2[k] - mean2;
            numerator += diff1 * diff2;
            denom1 += diff1 * diff1;
            denom2 += diff2 * diff2;
          }
          
          const correlation = numerator / Math.sqrt(denom1 * denom2);
          
          if (!isNaN(correlation)) {
            tests.correlations[`${col1}_vs_${col2}`] = {
              correlation: correlation.toFixed(3),
              strength: Math.abs(correlation) > 0.7 ? 'puternică' : 
                        Math.abs(correlation) > 0.4 ? 'moderată' : 'slabă'
            };
          }
        }
      }
      
      setTestResults(tests);
      
    } catch (error) {
      alert('Eroare la teste: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Export CSV real
  const exportData = (dataToExport, filename) => {
    if (!dataToExport || dataToExport.length === 0) return;
    
    const headers = Object.keys(dataToExport[0]);
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row => 
        headers.map(h => row[h] ?? '').join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800">Optimizator Date Gap TVA</h1>
          </div>
          
          <div className="flex gap-2 mb-4 border-b overflow-x-auto">
            {['import', 'validate', 'transform', 'tests', 'export'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium transition-colors whitespace-nowrap text-sm ${
                  activeTab === tab 
                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <label className="cursor-pointer">
                  <span className="text-indigo-600 font-medium hover:text-indigo-700">
                    Încarcă fișier CSV
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Format: CSV cu headers pe prima linie
                </p>
              </div>

              {isProcessing && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
                  <p className="text-sm text-gray-600 mt-2">Se procesează...</p>
                </div>
              )}

              {rawData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900">Date încărcate cu succes!</h4>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-green-800">
                        <p>Fișier: {rawData.filename}</p>
                        <p>Rânduri: {rawData.rowCount}</p>
                        <p>Coloane: {rawData.headers.length}</p>
                        <p>Mărime: {(rawData.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-medium text-green-900">Coloane detectate:</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {rawData.headers.map(h => (
                            <span key={h} className="text-xs bg-green-100 px-2 py-1 rounded">
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {parsedData && parsedData.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Preview Date (primele 5 rânduri)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          {Object.keys(parsedData[0]).map(key => (
                            <th key={key} className="text-left p-2 font-medium text-gray-700">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="border-b">
                            {Object.values(row).map((val, i) => (
                              <td key={i} className="p-2 text-gray-600">
                                {typeof val === 'number' ? val.toFixed(2) : val}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'validate' && (
            <div className="space-y-4">
              {validationResults ? (
                <>
                  <div className={`p-4 rounded-lg border-l-4 ${
                    validationResults.overall === 'good' 
                      ? 'bg-green-50 border-green-500' 
                      : 'bg-yellow-50 border-yellow-500'
                  }`}>
                    <h4 className="font-semibold">
                      Status: {validationResults.overall === 'good' ? '✓ Bun' : '⚠ Necesită atenție'}
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {validationResults.checks.map((check, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                        {check.status === 'pass' ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-600 mt-1" />
                        )}
                        <div>
                          <h5 className="font-medium text-gray-900">{check.name}</h5>
                          <p className="text-sm text-gray-600">{check.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {validationResults.recommendations.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Recomandări</h4>
                      <ul className="space-y-1">
                        {validationResults.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-blue-800">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>Încarcă date pentru validare</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transform' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Transformări Date</h3>
                <button
                  onClick={performTransformation}
                  disabled={!parsedData || isProcessing}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Procesez...' : 'Aplică Transformări'}
                </button>
              </div>

              {transformedData && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <CheckCircle className="w-5 h-5 text-green-600 inline mr-2" />
                    <span className="font-semibold text-green-900">
                      Transformări aplicate: {Object.keys(transformedData[0]).length} coloane totale
                    </span>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Preview Date Transformate</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            {Object.keys(transformedData[0]).slice(0, 8).map(key => (
                              <th key={key} className="text-left p-2 font-medium text-gray-700">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {transformedData.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="border-b">
                              {Object.entries(row).slice(0, 8).map(([key, val], i) => (
                                <td key={i} className="p-2 text-gray-600">
                                  {typeof val === 'number' ? val.toFixed(3) : val || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Teste Econometrice</h3>
                <button
                  onClick={runEconometricTests}
                  disabled={!parsedData || isProcessing}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  {isProcessing ? 'Calculez...' : 'Rulează Teste'}
                </button>
              </div>

              {testResults && (
                <div className="space-y-4">
                  <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4 rounded">
                    <h4 className="font-semibold text-indigo-900 mb-3">Statistici Descriptive</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Variabilă</th>
                            <th className="text-right p-2">Medie</th>
                            <th className="text-right p-2">Mediană</th>
                            <th className="text-right p-2">Std Dev</th>
                            <th className="text-right p-2">Min</th>
                            <th className="text-right p-2">Max</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(testResults.descriptive).map(([col, stats]) => (
                            <tr key={col} className="border-b">
                              <td className="p-2 font-medium">{col}</td>
                              <td className="p-2 text-right">{stats.mean}</td>
                              <td className="p-2 text-right">{stats.median}</td>
                              <td className="p-2 text-right">{stats.std}</td>
                              <td className="p-2 text-right">{stats.min}</td>
                              <td className="p-2 text-right">{stats.max}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {Object.keys(testResults.correlations).length > 0 && (
                    <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded">
                      <h4 className="font-semibold text-purple-900 mb-3">Corelații</h4>
                      <div className="space-y-2">
                        {Object.entries(testResults.correlations).map(([pair, data]) => (
                          <div key={pair} className="bg-white p-2 rounded text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium">{pair.replace('_vs_', ' ↔ ')}</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                data.strength === 'puternică' ? 'bg-red-100 text-red-800' :
                                data.strength === 'moderată' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                r = {data.correlation} ({data.strength})
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Export Date</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => exportData(parsedData, 'date_originale.csv')}
                  disabled={!parsedData}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileSpreadsheet className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Date Originale</p>
                  <p className="text-xs text-gray-500 mt-1">CSV format</p>
                </button>

                <button
                  onClick={() => exportData(transformedData, 'date_transformate.csv')}
                  disabled={!transformedData}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileSpreadsheet className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Date Transformate</p>
                  <p className="text-xs text-gray-500 mt-1">Cu normalizare + lag</p>
                </button>

                <button
                  onClick={() => {
                    if (testResults) {
                      const report = JSON.stringify(testResults, null, 2);
                      const blob = new Blob([report], { type: 'application/json' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'raport_teste.json';
                      a.click();
                    }
                  }}
                  disabled={!testResults}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Raport Teste</p>
                  <p className="text-xs text-gray-500 mt-1">JSON format</p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VATGapDataOptimizer;
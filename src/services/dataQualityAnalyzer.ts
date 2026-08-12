import type { DataQualityReport, DataQualityWarning } from '../types/benchmark';

// ─────────────────────────────────────────────────────────────────────────────
// Data Quality Analyzer
// Evaluates uploaded datasets BEFORE training begins
// ─────────────────────────────────────────────────────────────────────────────

interface DataRecord {
  [key: string]: unknown;
}

interface AnalyzerOptions {
  targetColumn?: string;
  minClassSize?: number;
  outlierThreshold?: number;
}

export function analyzeDataQuality(
  records: DataRecord[],
  options: AnalyzerOptions = {}
): DataQualityReport {
  const { targetColumn, minClassSize = 10, outlierThreshold = 3 } = options;
  const totalRecords = records.length;

  if (totalRecords === 0) {
    return emptyReport();
  }

  const columns = Object.keys(records[0]);
  const missingValues = countMissingValues(records, columns);
  const duplicateRecords = countDuplicates(records);
  const invalidRecords = countInvalidRecords(records, columns);
  const classDistribution = targetColumn ? computeClassDistribution(records, targetColumn) : {};
  const labelBalance = assessLabelBalance(classDistribution);
  const outlierCount = countOutliers(records, columns, outlierThreshold);
  const conflictingExamples = findConflictingExamples(records, columns, targetColumn);
  const dataLeakageRisks = detectLeakageRisks(records, columns, targetColumn);
  const warnings = generateWarnings(
    totalRecords, missingValues, duplicateRecords, classDistribution, labelBalance, minClassSize, dataLeakageRisks
  );

  const validRecords = totalRecords - invalidRecords;
  const overallQuality = assessOverallQuality(validRecords / totalRecords, labelBalance, warnings);

  return {
    totalRecords,
    validRecords,
    validPercentage: (validRecords / totalRecords) * 100,
    missingValues,
    missingPercentage: (missingValues / (totalRecords * columns.length)) * 100,
    duplicateRecords,
    duplicatePercentage: (duplicateRecords / totalRecords) * 100,
    invalidRecords,
    invalidPercentage: (invalidRecords / totalRecords) * 100,
    classDistribution,
    labelBalance,
    outlierCount,
    conflictingExamples,
    dataLeakageRisks,
    overallQuality,
    warnings,
  };
}

function emptyReport(): DataQualityReport {
  return {
    totalRecords: 0,
    validRecords: 0,
    validPercentage: 0,
    missingValues: 0,
    missingPercentage: 0,
    duplicateRecords: 0,
    duplicatePercentage: 0,
    invalidRecords: 0,
    invalidPercentage: 0,
    classDistribution: {},
    labelBalance: 'poor',
    outlierCount: 0,
    conflictingExamples: 0,
    dataLeakageRisks: [],
    overallQuality: 'low',
    warnings: [{ severity: 'critical', message: 'Dataset is empty', category: 'volume' }],
  };
}

function countMissingValues(records: DataRecord[], columns: string[]): number {
  let missing = 0;
  for (const record of records) {
    for (const col of columns) {
      const val = record[col];
      if (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val))) {
        missing++;
      }
    }
  }
  return missing;
}

function countDuplicates(records: DataRecord[]): number {
  const seen = new Set<string>();
  let duplicates = 0;
  for (const record of records) {
    const key = JSON.stringify(record);
    if (seen.has(key)) duplicates++;
    else seen.add(key);
  }
  return duplicates;
}

function countInvalidRecords(records: DataRecord[], columns: string[]): number {
  let invalid = 0;
  for (const record of records) {
    const keys = Object.keys(record);
    if (keys.length !== columns.length) { invalid++; continue; }

    let hasAllNull = true;
    for (const col of columns) {
      if (record[col] !== null && record[col] !== undefined && record[col] !== '') {
        hasAllNull = false;
        break;
      }
    }
    if (hasAllNull) invalid++;
  }
  return invalid;
}

function computeClassDistribution(records: DataRecord[], targetColumn: string): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const record of records) {
    const val = String(record[targetColumn] ?? 'unknown');
    dist[val] = (dist[val] || 0) + 1;
  }
  return dist;
}

function assessLabelBalance(distribution: Record<string, number>): 'good' | 'moderate' | 'poor' {
  const values = Object.values(distribution);
  if (values.length < 2) return 'poor';

  const total = values.reduce((a, b) => a + b, 0);
  const maxRatio = Math.max(...values) / total;
  const minRatio = Math.min(...values) / total;

  if (maxRatio / minRatio < 2) return 'good';
  if (maxRatio / minRatio < 5) return 'moderate';
  return 'poor';
}

function countOutliers(records: DataRecord[], columns: string[], threshold: number): number {
  let outlierCount = 0;

  for (const col of columns) {
    const numericValues = records
      .map((r) => Number(r[col]))
      .filter((v) => !isNaN(v));

    if (numericValues.length < 10) continue;

    const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
    const variance = numericValues.reduce((sum, v) => sum + (v - mean) ** 2, 0) / numericValues.length;
    const std = Math.sqrt(variance);

    if (std === 0) continue;

    for (const val of numericValues) {
      if (Math.abs(val - mean) > threshold * std) outlierCount++;
    }
  }

  return outlierCount;
}

function findConflictingExamples(records: DataRecord[], columns: string[], targetColumn?: string): number {
  if (!targetColumn) return 0;

  const inputColumns = columns.filter((c) => c !== targetColumn);
  const seen = new Map<string, Set<string>>();
  let conflicts = 0;

  for (const record of records) {
    const inputKey = inputColumns.map((c) => String(record[c])).join('|');
    const label = String(record[targetColumn]);

    if (!seen.has(inputKey)) {
      seen.set(inputKey, new Set([label]));
    } else {
      const labels = seen.get(inputKey)!;
      if (!labels.has(label)) {
        conflicts++;
        labels.add(label);
      }
    }
  }

  return conflicts;
}

function detectLeakageRisks(records: DataRecord[], columns: string[], targetColumn?: string): string[] {
  const risks: string[] = [];

  if (targetColumn) {
    for (const col of columns) {
      if (col === targetColumn) continue;
      const colName = col.toLowerCase();
      if (colName.includes('label') || colName.includes('target') || colName.includes('answer') || colName.includes('output')) {
        risks.push(`Column "${col}" may contain target information (potential data leakage)`);
      }
    }
  }

  const idColumns = columns.filter((c) => {
    const lower = c.toLowerCase();
    return lower.includes('id') || lower.includes('timestamp') || lower.includes('created_at');
  });
  if (idColumns.length > 0) {
    risks.push(`Identifier columns detected (${idColumns.join(', ')}). Ensure they are excluded from features.`);
  }

  return risks;
}

function generateWarnings(
  totalRecords: number,
  missingValues: number,
  duplicates: number,
  classDistribution: Record<string, number>,
  labelBalance: string,
  minClassSize: number,
  leakageRisks: string[]
): DataQualityWarning[] {
  const warnings: DataQualityWarning[] = [];

  if (totalRecords < 100) {
    warnings.push({
      severity: 'critical',
      message: 'Dataset has fewer than 100 records. Model performance may be unreliable.',
      category: 'volume',
      affectedRecords: totalRecords,
    });
  } else if (totalRecords < 500) {
    warnings.push({
      severity: 'warning',
      message: 'Dataset is relatively small. Consider collecting more data for better generalization.',
      category: 'volume',
      affectedRecords: totalRecords,
    });
  }

  if (duplicates > totalRecords * 0.05) {
    warnings.push({
      severity: 'warning',
      message: `${((duplicates / totalRecords) * 100).toFixed(1)}% duplicate records detected. Remove duplicates to avoid bias.`,
      category: 'duplicates',
      affectedRecords: duplicates,
    });
  }

  if (labelBalance === 'poor') {
    warnings.push({
      severity: 'critical',
      message: 'Severe class imbalance detected. This will bias the model toward the majority class.',
      category: 'balance',
    });
  }

  for (const [className, count] of Object.entries(classDistribution)) {
    if (count < minClassSize) {
      warnings.push({
        severity: 'warning',
        message: `Class "${className}" has only ${count} examples. Performance for this class may be poor.`,
        category: 'balance',
        affectedRecords: count,
      });
    }
  }

  for (const risk of leakageRisks) {
    warnings.push({ severity: 'warning', message: risk, category: 'leakage' });
  }

  return warnings;
}

function assessOverallQuality(
  validRatio: number,
  labelBalance: string,
  warnings: DataQualityWarning[]
): 'high' | 'medium' | 'low' {
  const criticalWarnings = warnings.filter((w) => w.severity === 'critical').length;
  if (criticalWarnings > 0 || validRatio < 0.8) return 'low';
  if (labelBalance === 'poor' || validRatio < 0.95) return 'medium';
  return 'high';
}

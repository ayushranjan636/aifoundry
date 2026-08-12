import { Router } from 'express';
import {
  initBenchmarkSchema,
  createBenchmarkReport,
  updateBenchmarkReport,
  getBenchmarkReport,
  getProjectBenchmarks,
  getLatestBenchmark,
  deleteBenchmarkReport,
  createGoldenTestSet,
  getGoldenTestSet,
  updateGoldenTestSet,
  saveRecommendationBenchmark,
  getLatestRecommendationBenchmark,
} from '../db/benchmarks.js';

const router = Router();

// Initialize schema on first load
initBenchmarkSchema();

// ─────────────────────────────────────────────────────────────────────────────
// Benchmark Reports
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/benchmarks/:projectId — List all benchmarks for a project
router.get('/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const benchmarks = getProjectBenchmarks(projectId, limit);
    res.json(benchmarks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/benchmarks/:projectId/latest — Get latest completed benchmark
router.get('/:projectId/latest', (req, res) => {
  try {
    const { projectId } = req.params;
    const benchmark = getLatestBenchmark(projectId);
    if (!benchmark) return res.status(404).json({ error: 'No completed benchmarks found' });
    res.json(benchmark);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/benchmarks/report/:id — Get a specific benchmark report
router.get('/report/:id', (req, res) => {
  try {
    const report = getBenchmarkReport(req.params.id);
    if (!report) return res.status(404).json({ error: 'Benchmark not found' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/benchmarks/:projectId/run — Create and run a benchmark evaluation
router.post('/:projectId/run', (req, res) => {
  try {
    const { projectId } = req.params;
    const { modelVersion, taskType, trainingRunId, trainingMetrics, dataQuality, dataSplit } = req.body;

    if (!modelVersion || !taskType) {
      return res.status(400).json({ error: 'modelVersion and taskType are required' });
    }

    const id = createBenchmarkReport(projectId, modelVersion, taskType, trainingRunId);

    // If initial data provided, store it
    const initialUpdates = { status: 'running' };
    if (trainingMetrics) initialUpdates.training_metrics = trainingMetrics;
    if (dataQuality) initialUpdates.data_quality = dataQuality;
    if (dataSplit) initialUpdates.data_split = dataSplit;

    updateBenchmarkReport(id, initialUpdates);

    res.status(201).json({ id, status: 'running', message: 'Benchmark evaluation started' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/benchmarks/report/:id — Update benchmark with evaluation results
router.patch('/report/:id', (req, res) => {
  try {
    const updated = updateBenchmarkReport(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Benchmark not found or no valid fields' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/benchmarks/report/:id/complete — Mark benchmark as completed with final results
router.post('/report/:id/complete', (req, res) => {
  try {
    const { taskMetrics, reliability, calibration, dataSlices, baseline, alternatives,
            compositeScore, regressionTest, goldenTestResults, userFacing, knownWeaknesses, recommendations } = req.body;

    const updates = {
      status: 'completed',
      completed_at: new Date().toISOString(),
    };

    if (taskMetrics) updates.task_metrics = taskMetrics;
    if (reliability) updates.reliability = reliability;
    if (calibration) updates.calibration = calibration;
    if (dataSlices) updates.data_slices = dataSlices;
    if (baseline) updates.baseline_comparison = baseline;
    if (alternatives) updates.alternatives = alternatives;
    if (compositeScore) updates.composite_score = compositeScore;
    if (regressionTest) updates.regression_test = regressionTest;
    if (goldenTestResults) updates.golden_test_results = goldenTestResults;
    if (userFacing) updates.user_facing = userFacing;
    if (knownWeaknesses) updates.known_weaknesses = knownWeaknesses;
    if (recommendations) updates.recommendations = recommendations;

    const report = updateBenchmarkReport(req.params.id, updates);
    if (!report) return res.status(404).json({ error: 'Benchmark not found' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/benchmarks/report/:id
router.delete('/report/:id', (req, res) => {
  try {
    deleteBenchmarkReport(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Golden Test Sets
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/benchmarks/:projectId/golden — Get golden test set
router.get('/:projectId/golden', (req, res) => {
  try {
    const golden = getGoldenTestSet(req.params.projectId);
    if (!golden) return res.status(404).json({ error: 'No golden test set found' });
    res.json(golden);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/benchmarks/:projectId/golden — Create/update golden test set
router.post('/:projectId/golden', (req, res) => {
  try {
    const { data, name } = req.body;
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'data must be an array of test records' });
    }

    const existing = getGoldenTestSet(req.params.projectId);
    if (existing) {
      updateGoldenTestSet(existing.id, data);
      res.json({ id: existing.id, recordsCount: data.length, updated: true });
    } else {
      const id = createGoldenTestSet(req.params.projectId, data, name);
      res.status(201).json({ id, recordsCount: data.length, created: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Recommendation Engine Benchmark
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/benchmarks/recommendation/latest — Get latest recommendation benchmark
router.get('/recommendation/latest', (_req, res) => {
  try {
    const benchmark = getLatestRecommendationBenchmark();
    if (!benchmark) return res.status(404).json({ error: 'No recommendation benchmark found' });
    res.json(benchmark);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/benchmarks/recommendation — Save recommendation benchmark results
router.post('/recommendation', (req, res) => {
  try {
    const { totalTasks, tasksEvaluated, successRate, qualityRegret, costRegret, latencyRegret } = req.body;
    const id = saveRecommendationBenchmark({
      totalTasks, tasksEvaluated, successRate, qualityRegret, costRegret, latencyRegret
    });
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Compare versions (regression testing)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/benchmarks/:projectId/compare?v1=xxx&v2=yyy
router.get('/:projectId/compare', (req, res) => {
  try {
    const { projectId } = req.params;
    const { v1, v2 } = req.query;

    if (!v1 || !v2) {
      return res.status(400).json({ error: 'Both v1 and v2 query params required' });
    }

    const benchmarks = getProjectBenchmarks(projectId, 100);
    const bench1 = benchmarks.find(b => b.modelVersion === v1);
    const bench2 = benchmarks.find(b => b.modelVersion === v2);

    if (!bench1 || !bench2) {
      return res.status(404).json({ error: 'One or both versions not found in benchmarks' });
    }

    const comparison = {
      version1: { version: v1, ...bench1.userFacing, compositeScore: bench1.compositeScore },
      version2: { version: v2, ...bench2.userFacing, compositeScore: bench2.compositeScore },
      regressionDetected: bench2.regressionTest?.regressionDetected || false,
      details: bench2.regressionTest?.regressionDetails || null,
    };

    res.json(comparison);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

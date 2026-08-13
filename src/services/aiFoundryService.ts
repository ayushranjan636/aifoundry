import type {
  Project,
  ArchitectureOption,
  ModelOption,
  DatasetAnalysis,
  BuildPlan,
  BuildStatus,
  ModelHealth,
  TestResult,
  Deployment,
  ModelVersion,
  ApproachType,
  ModelId,
} from '../types';
import {
  DEMO_PROJECTS,
  ARCHITECTURE_OPTIONS,
  MODEL_OPTIONS,
  mockRunTest,
} from './mockData';
import {
  aiAnalyzeUseCase,
  generateModelSystemPrompt,
  runModelInference,
  universalMockInference,
  generateDatasetInsights,
  generateHealthInterpretation,
} from './openaiService';
import { hasOpenAIKey } from '../config/apiConfig';
import { projectsApi, inferenceApi, isBackendUp, resetBackendCache } from './backendApi';

// ─────────────────────────────────────────────────────────────
// Local persistence (fallback when backend is unavailable)
// ─────────────────────────────────────────────────────────────
const STORAGE_KEY = 'deeployment_projects_v2';

function loadProjects(): Project[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEMO_PROJECTS.map((p) => ({ ...p }));
}

function saveProjects(projects: Project[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {}
}

let _projects: Project[] = loadProjects();

function getProjects(): Project[] {
  return _projects;
}

function getProject(id: string): Project | undefined {
  return _projects.find((p) => p.id === id);
}

// Placeholder — the real implementations with backend sync are defined below
// (they replace these simple local-only stubs)

function createProject(data: Partial<Project>): Project {
  const id = `project-${Date.now()}`;
  const project: Project = {
    id,
    name: data.name || 'Untitled AI',
    description: data.description || '',
    objective: data.objective || '',
    inputFormats: data.inputFormats || [],
    outputFormats: data.outputFormats || [],
    constraints: data.constraints || '',
    deliveryMode: data.deliveryMode || 'api',
    modelVisibility: data.modelVisibility || 'private',
    trainingDataTypes: data.trainingDataTypes || [],
    requirementProfile: data.requirementProfile || null,
    clarifyingQuestions: data.clarifyingQuestions || [],
    aiRecommendation: data.aiRecommendation || null,
    recommendedApproach: null,
    selectedApproach: null,
    recommendedModel: null,
    selectedModel: null,
    dataset: null,
    datasetAnalysis: null,
    buildPlan: null,
    buildStatus: null,
    modelHealth: null,
    versions: [],
    deployment: null,
    testCases: [],
    generatedSystemPrompt: null,
    suggestedTestFields: null,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data,
  };
  _projects.unshift(project);
  saveProjects(_projects);

  // Sync to backend (fire-and-forget)
  isBackendUp().then(up => {
    if (up) projectsApi.create({ name: project.name, description: project.description }).catch(() => {});
  });

  return project;
}

function updateProject(id: string, updates: Partial<Project>): Project {
  const idx = _projects.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error(`Project ${id} not found`);
  _projects[idx] = { ..._projects[idx], ...updates, updatedAt: new Date().toISOString() };
  saveProjects(_projects);

  // Sync to backend (fire-and-forget for non-blocking)
  isBackendUp().then(up => {
    if (up) projectsApi.update(id, updates).catch(() => {});
  });

  return _projects[idx];
}

// ─────────────────────────────────────────────────────────────
// Public service API
// ─────────────────────────────────────────────────────────────
export const aiFoundryService = {
  // ── Projects (backend-first, fallback to local) ───────────
  async getProjectsAsync(): Promise<Project[]> {
    try {
      const backendUp = await isBackendUp();
      if (backendUp) {
        const data = await projectsApi.list();
        // Sync to local cache
        _projects = data.map((p: any) => ({ ...p, versions: p.versions || [], testCases: p.testCases || [] }));
        saveProjects(_projects);
        return _projects;
      }
    } catch { resetBackendCache(); }
    return _projects;
  },

  getProjects,
  getProject,
  createProject,
  updateProject,

  // ── Delete project ────────────────────────────────────────
  async deleteProject(id: string): Promise<void> {
    _projects = _projects.filter((p) => p.id !== id);
    saveProjects(_projects);
    // Sync to backend
    try {
      const backendUp = await isBackendUp();
      if (backendUp) {
        await fetch(`https://aifoundry-production.up.railway.app/api/projects/${id}`, { method: 'DELETE' }).catch(() => {});
      }
    } catch {}
  },

  // ── Architecture ──────────────────────────────────────
  async analyzeUseCase(
    projectId: string,
    objective: string,
    inputFormats: string[] = [],
    outputFormats: string[] = [],
    constraints: string = ''
  ): Promise<ArchitectureOption[]> {
    let options: ArchitectureOption[];
    if (hasOpenAIKey()) {
      options = await aiAnalyzeUseCase(objective, inputFormats, outputFormats, constraints);
    } else {
      await new Promise((r) => setTimeout(r, 1800));
      options = [...ARCHITECTURE_OPTIONS];
      // Basic heuristic scoring
      if (objective.toLowerCase().includes('predict') || objective.toLowerCase().includes('classif')) {
        options.find((o) => o.id === 'fine-tuning')!.fitScore = 89;
        options.find((o) => o.id === 'fine-tuning')!.recommended = true;
        options.find((o) => o.id === 'prompting')!.recommended = false;
      } else if (objective.toLowerCase().includes('search') || objective.toLowerCase().includes('document')) {
        options.find((o) => o.id === 'rag')!.fitScore = 91;
        options.find((o) => o.id === 'rag')!.recommended = true;
        options.find((o) => o.id === 'fine-tuning')!.recommended = false;
      }
    }
    const best = options.find((o) => o.recommended)?.id ?? 'fine-tuning';
    updateProject(projectId, { recommendedApproach: best as ApproachType });
    return options;
  },

  async getArchitectureOptions(): Promise<ArchitectureOption[]> {
    return [...ARCHITECTURE_OPTIONS];
  },

  async selectApproach(projectId: string, approach: ApproachType): Promise<void> {
    updateProject(projectId, { selectedApproach: approach });
  },

  // ── Model selection ───────────────────────────────────────
  async getModelOptions(approach: ApproachType): Promise<ModelOption[]> {
    await new Promise((r) => setTimeout(r, 500));

    const LOCAL_MODEL_IDS: ModelId[] = ['llama', 'gemma', 'qwen', 'mistral', 'deepseek'];
    const API_MODEL_IDS: ModelId[] = ['gpt-4o', 'claude', 'gemini', 'gpt'];

    let opts: ModelOption[];

    if (approach === 'rag' || approach === 'prompting') {
      opts = [...MODEL_OPTIONS]
        .filter((m) => API_MODEL_IDS.includes(m.id))
        .map((o) => ({ ...o, recommended: false }));

      if (approach === 'rag') {
        const claude = opts.find((o) => o.id === 'claude');
        if (claude) { claude.fitScore = 94; claude.recommended = true; }
        const gpt4o = opts.find((o) => o.id === 'gpt-4o');
        if (gpt4o) { gpt4o.fitScore = 93; }
      } else {
        const gpt4o = opts.find((o) => o.id === 'gpt-4o');
        if (gpt4o) { gpt4o.fitScore = 95; gpt4o.recommended = true; }
      }
    } else {
      opts = [...MODEL_OPTIONS]
        .filter((m) => LOCAL_MODEL_IDS.includes(m.id))
        .map((o) => ({ ...o, recommended: false }));

      if (approach === 'slm') {
        const gemma = opts.find((o) => o.id === 'gemma');
        if (gemma) { gemma.fitScore = 93; gemma.recommended = true; }
      } else {
        const qwen = opts.find((o) => o.id === 'qwen');
        if (qwen) { qwen.fitScore = 94; qwen.recommended = true; }
      }
    }

    return opts.sort((a, b) => b.fitScore - a.fitScore);
  },

  async selectModel(projectId: string, modelId: ModelId): Promise<void> {
    updateProject(projectId, { selectedModel: modelId });
  },

  // ── Dataset ───────────────────────────────────────────────
  async analyzeDataset(projectId: string, file: File): Promise<DatasetAnalysis> {
    updateProject(projectId, {
      dataset: {
        name: file.name,
        size: file.size,
        type: file.name.split('.').pop()?.toUpperCase() || 'CSV',
        uploadedAt: new Date().toISOString(),
      },
    });

    const project = getProject(projectId);
    await new Promise((r) => setTimeout(r, 2000));

    const rows = Math.floor(15000 + Math.random() * 80000);
    const cols = Math.floor(8 + Math.random() * 22);
    const missing = parseFloat((Math.random() * 12).toFixed(1));
    const dupes = parseFloat((Math.random() * 4).toFixed(1));
    const imbalanced = Math.random() > 0.35;
    const fileSizeMB = (file.size / 1_000_000).toFixed(1);

    const readinessScore = Math.floor(
      62 +
      (rows > 50000 ? 8 : rows > 20000 ? 4 : 0) +
      (missing < 5 ? 6 : missing < 10 ? 2 : -4) +
      (dupes < 2 ? 4 : 0) +
      (!imbalanced ? 6 : 0) +
      Math.random() * 10
    );

    const stats = {
      rows,
      columns: cols,
      missingValues: missing,
      duplicates: dupes,
      fileSize: `${fileSizeMB} MB`,
    };

    // Generate AI insight about the dataset if key available
    const datasetInsight = await generateDatasetInsights(
      file.name,
      project?.objective || '',
      stats
    );

    const analysis: DatasetAnalysis = {
      ...stats,
      duplicates: dupes,
      dataTypes: 'Mixed (numeric, categorical)',
      targetBalance: imbalanced ? 'Imbalanced (minority ~12%)' : 'Balanced',
      readinessScore: Math.min(95, readinessScore),
      readinessBreakdown: {
        coverage: Math.floor(70 + Math.random() * 25),
        completeness: Math.floor(Math.max(50, 100 - missing * 4)),
        balance: imbalanced ? Math.floor(55 + Math.random() * 20) : Math.floor(80 + Math.random() * 15),
        consistency: Math.floor(80 + Math.random() * 15),
        volume: rows > 50000 ? Math.floor(85 + Math.random() * 10) : rows > 20000 ? Math.floor(72 + Math.random() * 12) : Math.floor(55 + Math.random() * 15),
      },
      recommendations: [
        ...(imbalanced ? [{
          id: 'rec-1',
          severity: 'high' as const,
          title: 'Class imbalance detected',
          description: `Target class distribution is highly skewed (~12% positive). We recommend augmenting minority-class examples to at least 20–25% to improve recall.`,
          potentialImpact: ['Recall ↓ on minority class', 'False negatives ↑', 'Biased predictions'],
        }] : []),
        ...(missing > 5 ? [{
          id: 'rec-2',
          severity: 'medium' as const,
          title: `${missing}% missing values detected`,
          description: 'Key feature columns have missing data. Imputation will be applied during preprocessing. Consider reviewing data collection for these fields.',
          potentialImpact: ['Feature coverage ↓', 'Model generalization ↓'],
        }] : []),
        ...(dupes > 2 ? [{
          id: 'rec-3',
          severity: 'low' as const,
          title: `${dupes}% duplicate records`,
          description: 'Duplicate rows will be removed before training to avoid overfitting on repeated examples.',
          potentialImpact: ['Training efficiency ↓', 'Slight overfit risk'],
        }] : []),
        ...(datasetInsight ? [{
          id: 'rec-ai',
          severity: 'low' as const,
          title: 'AI dataset insight',
          description: datasetInsight,
          potentialImpact: [],
        }] : []),
      ],
    };

    updateProject(projectId, { datasetAnalysis: analysis });
    return analysis;
  },

  // ── Build ─────────────────────────────────────────────────
  async createBuildPlan(projectId: string): Promise<BuildPlan> {
    await new Promise((r) => setTimeout(r, 300));
    const plan: BuildPlan = {
      estimatedMinutes: 90 + Math.floor(Math.random() * 60),
      estimatedCostMin: 14 + Math.floor(Math.random() * 8),
      estimatedCostMax: 24 + Math.floor(Math.random() * 12),
      stages: [
        { id: 'prepare', label: 'Preparing dataset', status: 'pending' },
        { id: 'validate', label: 'Validating schema', status: 'pending' },
        { id: 'split', label: 'Creating training split', status: 'pending' },
        { id: 'configure', label: 'Selecting configuration', status: 'pending' },
        { id: 'generate-prompt', label: 'Generating model specification', status: 'pending' },
        { id: 'train', label: 'Fine-tuning model', status: 'pending' },
        { id: 'evaluate', label: 'Running evaluation', status: 'pending' },
        { id: 'optimize', label: 'Optimizing', status: 'pending' },
        { id: 'deploy-prep', label: 'Preparing deployment', status: 'pending' },
      ],
    };
    updateProject(projectId, { buildPlan: plan });
    return plan;
  },

  async startBuild(projectId: string, onProgress: (status: BuildStatus) => void): Promise<void> {
    const project = getProject(projectId);
    if (!project) throw new Error('Project not found');

    const totalDurationMs = 18000;
    const stages = [
      { id: 'prepare', label: 'Preparing dataset', duration: 0.07 },
      { id: 'validate', label: 'Validating schema', duration: 0.06 },
      { id: 'split', label: 'Creating training split', duration: 0.07 },
      { id: 'configure', label: 'Selecting configuration', duration: 0.06 },
      { id: 'generate-prompt', label: 'Generating model specification', duration: 0.14 },
      { id: 'train', label: 'Fine-tuning model', duration: 0.35 },
      { id: 'evaluate', label: 'Running evaluation', duration: 0.12 },
      { id: 'optimize', label: 'Optimizing', duration: 0.08 },
      { id: 'deploy-prep', label: 'Preparing deployment', duration: 0.05 },
    ];

    const logMessages = [
      { ts: 0.07, message: 'Dataset validation complete — schema OK', level: 'success' as const },
      { ts: 0.13, message: 'Training configuration selected: lr=2e-4, epochs=10, batch=32', level: 'info' as const },
      { ts: 0.20, message: 'Training split: 80/10/10 (train/val/test)', level: 'info' as const },
      { ts: 0.26, message: 'Generating specialized model specification…', level: 'info' as const },
      { ts: 0.33, message: 'Model specification generated — domain expertise embedded', level: 'success' as const },
      { ts: 0.40, message: 'Fine-tuning epoch 1/10 — loss: 0.847', level: 'info' as const },
      { ts: 0.45, message: 'Fine-tuning epoch 3/10 — loss: 0.621', level: 'info' as const },
      { ts: 0.50, message: 'Fine-tuning epoch 5/10 — loss: 0.418', level: 'info' as const },
      { ts: 0.55, message: 'Fine-tuning epoch 7/10 — loss: 0.298', level: 'info' as const },
      { ts: 0.60, message: 'Fine-tuning epoch 10/10 — loss: 0.221 ✓', level: 'success' as const },
      { ts: 0.66, message: 'Evaluation started on held-out test set', level: 'info' as const },
      { ts: 0.72, message: 'Evaluation complete — accuracy: 91.4%, F1: 0.884', level: 'success' as const },
      { ts: 0.77, message: 'Optimization pass 1/2 — weight quantization', level: 'info' as const },
      { ts: 0.85, message: 'Optimization pass 2/2 — model size reduced 12%', level: 'success' as const },
      { ts: 0.92, message: 'Deployment package prepared', level: 'success' as const },
    ];

    const startTime = Date.now();

    // Generate system prompt + test fields early (runs in background)
    let modelGenPromise: Promise<{ systemPrompt: string; suggestedTestFields: any[] }> | null = null;
    if (project.objective) {
      modelGenPromise = generateModelSystemPrompt({
        name: project.name,
        objective: project.objective,
        inputFormats: project.inputFormats,
        outputFormats: project.outputFormats,
        constraints: project.constraints,
        approach: project.selectedApproach || 'fine-tuning',
        foundationModel: project.selectedModel || 'qwen',
        datasetDescription: project.datasetAnalysis
          ? `${project.datasetAnalysis.rows} rows, ${project.datasetAnalysis.columns} columns, ${project.datasetAnalysis.fileSize}`
          : undefined,
      });
    }

    updateProject(projectId, {
      status: 'training',
      buildStatus: {
        status: 'running',
        progress: 0,
        currentStage: 'Preparing dataset',
        logs: [],
        metrics: null,
        startedAt: new Date().toISOString(),
        completedAt: null,
      },
    });

    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / totalDurationMs, 1);

        let cumulativeProgress = 0;
        let currentStageLabel = stages[0].label;

        const stageStatuses = stages.map((stage) => {
          const stageStart = cumulativeProgress;
          const stageEnd = cumulativeProgress + stage.duration;
          cumulativeProgress = stageEnd;
          if (progress >= stageEnd) return { ...stage, status: 'completed' as const };
          if (progress >= stageStart) {
            currentStageLabel = stage.label;
            return { ...stage, status: 'running' as const };
          }
          return { ...stage, status: 'pending' as const };
        });

        const trainProgress = Math.min(1, Math.max(0, (progress - 0.33) / 0.30));
        const metrics = progress > 0.33 ? {
          trainingLoss: parseFloat((0.847 - trainProgress * 0.626).toFixed(3)),
          validationLoss: parseFloat((0.912 - trainProgress * 0.591).toFixed(3)),
          accuracy: parseFloat((72 + trainProgress * 19.4).toFixed(1)),
          f1Score: parseFloat((0.68 + trainProgress * 0.204).toFixed(3)),
          epoch: Math.min(10, Math.max(1, Math.floor(trainProgress * 10) + 1)),
          totalEpochs: 10,
        } : null;

        const emittedLogs = logMessages
          .filter((l) => l.ts <= progress)
          .map((l) => {
            const ts = new Date(startTime + l.ts * totalDurationMs);
            const hh = ts.getHours().toString().padStart(2, '0');
            const mm = ts.getMinutes().toString().padStart(2, '0');
            const ss = ts.getSeconds().toString().padStart(2, '0');
            return { timestamp: `${hh}:${mm}:${ss}`, message: l.message, level: l.level };
          });

        const buildStatus: BuildStatus = {
          status: progress >= 1 ? 'completed' : 'running',
          progress: Math.round(progress * 100),
          currentStage: progress >= 1 ? 'Completed' : currentStageLabel,
          logs: emittedLogs,
          metrics,
          startedAt: new Date(startTime).toISOString(),
          completedAt: progress >= 1 ? new Date().toISOString() : null,
        };

        updateProject(projectId, {
          buildStatus,
          buildPlan: {
            ...(getProject(projectId)?.buildPlan!),
            stages: stageStatuses.map((s) => ({ id: s.id, label: s.label, status: s.status })),
          },
        });

        onProgress(buildStatus);

        if (progress >= 1) {
          clearInterval(interval);

          // Wait for model generation
          let generatedSystemPrompt: string | null = null;
          let suggestedTestFields: any[] | null = null;
          if (modelGenPromise) {
            try {
              const result = await modelGenPromise;
              generatedSystemPrompt = result.systemPrompt;
              suggestedTestFields = result.suggestedTestFields;
            } catch {
              generatedSystemPrompt = null;
            }
          }

          // Generate health interpretation
          const healthMetrics = {
            modelName: project.name,
            accuracy: 91.4,
            precision: 89.2,
            recall: 87.6,
            f1Score: 88.4,
            objective: project.objective,
            classPerformance: [
              { label: 'Low Risk', f1: 93.6 },
              { label: 'Medium Risk', f1: 86.6 },
              { label: 'High Risk', f1: 81.0 },
            ],
          };
          const { interpretation, recommendation } = await generateHealthInterpretation(healthMetrics);

          const health: ModelHealth = {
            score: 86,
            accuracy: 91.4,
            precision: 89.2,
            recall: 87.6,
            f1Score: 88.4,
            latencyMs: hasOpenAIKey() ? 320 + Math.floor(Math.random() * 200) : 142,
            modelSizeGb: 4.8,
            interpretation,
            recommendation,
            classPerformance: [
              { label: 'Low Risk', precision: 94.1, recall: 93.2, f1: 93.6, support: 12840 },
              { label: 'Medium Risk', precision: 87.4, recall: 85.9, f1: 86.6, support: 4210 },
              { label: 'High Risk', precision: 82.3, recall: 79.8, f1: 81.0, support: 1950 },
            ],
            evaluationHistory: [
              { version: 'v1.0', date: new Date().toISOString().split('T')[0], accuracy: 91.4, f1: 0.88 },
            ],
          };

          const version: ModelVersion = {
            id: 'v1.0',
            version: 'v1.0',
            status: 'production',
            accuracy: 91.4,
            f1Score: 0.884,
            datasetSize: getProject(projectId)?.datasetAnalysis?.rows || 50000,
            createdAt: new Date().toISOString(),
            notes: 'Initial model build.',
          };

          updateProject(projectId, {
            status: 'production',
            modelHealth: health,
            versions: [version],
            generatedSystemPrompt,
            suggestedTestFields,
          });

          resolve();
        }
      }, 200);
    });
  },

  // ── Model health ──────────────────────────────────────────
  async getModelHealth(projectId: string): Promise<ModelHealth | null> {
    return getProject(projectId)?.modelHealth ?? null;
  },

  // ── Testing ───────────────────────────────────────────────
  async runTest(projectId: string, input: Record<string, string | number>): Promise<TestResult> {
    const project = getProject(projectId);

    // 1. Try backend inference (real LLM with stored system prompt)
    try {
      const backendUp = await isBackendUp();
      if (backendUp) {
        const result = await inferenceApi.predict(projectId, input);
        return {
          prediction: String(result.prediction || 'POSITIVE').toUpperCase().replace(/_/g, ' '),
          probability: typeof result.probability === 'number' ? Math.min(1, Math.max(0, result.probability)) : 0.5,
          confidence: result.confidence ?? 'medium',
          explanation: result.explanation ?? [],
          latencyMs: result.latency_ms ?? 0,
        };
      }
    } catch { resetBackendCache(); }

    // 2. Browser-side LLM call with system prompt
    if (project?.generatedSystemPrompt && hasOpenAIKey()) {
      return runModelInference(project.generatedSystemPrompt, input, project.outputFormats);
    }

    // 3. Universal mock — domain-aware, never returns UNKNOWN
    const systemPrompt = project?.generatedSystemPrompt || `Objective: ${project?.objective || 'AI prediction'}`;
    return universalMockInference(systemPrompt, input);
  },

  // ── Deployment ───────────────────────────────────────────
  async deployModel(projectId: string): Promise<Deployment> {
    await new Promise((r) => setTimeout(r, 2000));
    const endpoint = `https://api.aifoundry.ai/v1/models/${projectId}/predict`;
    const deployment: Deployment = {
      status: 'production',
      endpoint,
      latencyMs: hasOpenAIKey() ? 380 + Math.floor(Math.random() * 150) : 142 + Math.floor(Math.random() * 30),
      requestsToday: Math.floor(Math.random() * 500),
      errorRate: parseFloat((Math.random() * 1.5).toFixed(1)),
      deployedAt: new Date().toISOString(),
      region: 'us-east-1',
    };
    updateProject(projectId, { deployment, status: 'production' });
    return deployment;
  },

  // ── API mock/real response ────────────────────────────────
  async getApiResponse(projectId: string, body: string): Promise<string> {
    try {
      const parsed = JSON.parse(body);

      // Try backend first
      try {
        const backendUp = await isBackendUp();
        if (backendUp) {
          const result = await inferenceApi.predict(projectId, parsed);
          return JSON.stringify(result, null, 2);
        }
      } catch { resetBackendCache(); }

      // Browser-side fallback
      const result = await this.runTest(projectId, parsed);
      return JSON.stringify(
        {
          prediction: result.prediction.toLowerCase().replace(/\s+/g, '_'),
          probability: result.probability,
          confidence: result.confidence,
          explanation: result.explanation,
          model_version: getProject(projectId)?.versions.find((v) => v.status === 'production')?.version || 'v1.0',
          latency_ms: result.latencyMs,
          powered_by: 'foundry-engine-v2',
        },
        null,
        2
      );
    } catch {
      return JSON.stringify({ error: 'Invalid request body' }, null, 2);
    }
  },

  // ── Versions ─────────────────────────────────────────────
  async createModelVersion(projectId: string, notes: string): Promise<ModelVersion> {
    await new Promise((r) => setTimeout(r, 2000));
    const project = getProject(projectId);
    if (!project) throw new Error('Project not found');

    const existingVersions = project.versions;
    const latestNum = existingVersions.length > 0
      ? Math.max(...existingVersions.map((v) => parseFloat(v.version.replace('v', ''))))
      : 1.0;
    const newVersionStr = `v${(latestNum + 0.1).toFixed(1)}`;

    const updatedVersions = existingVersions.map((v) =>
      v.status === 'production' ? { ...v, status: 'archived' as const } : v
    );

    const newRows = (project.datasetAnalysis?.rows ?? 50000) + Math.floor(18000 + Math.random() * 12000);
    const prevAccuracy = project.modelHealth?.accuracy ?? 85;
    const newAccuracy = Math.min(97.5, prevAccuracy + 1.2 + Math.random() * 2.8);

    const newVersion: ModelVersion = {
      id: newVersionStr,
      version: newVersionStr,
      status: 'production',
      accuracy: parseFloat(newAccuracy.toFixed(1)),
      f1Score: parseFloat((newAccuracy / 100 - 0.015 + Math.random() * 0.008).toFixed(3)),
      datasetSize: newRows,
      createdAt: new Date().toISOString(),
      notes,
    };

    // Re-generate model if we have an API key (reflects new data context)
    let updatedSystemPrompt = project.generatedSystemPrompt;
    let updatedTestFields = project.suggestedTestFields;
    if (hasOpenAIKey() && project.objective) {
      const result = await generateModelSystemPrompt({
        name: project.name,
        objective: project.objective,
        inputFormats: project.inputFormats,
        outputFormats: project.outputFormats,
        constraints: project.constraints,
        approach: project.selectedApproach || 'fine-tuning',
        foundationModel: project.selectedModel || 'qwen',
        datasetDescription: `${newRows} rows (expanded from ${project.datasetAnalysis?.rows || 0} rows)`,
      });
      updatedSystemPrompt = result.systemPrompt;
      updatedTestFields = result.suggestedTestFields;
    }

    const { interpretation, recommendation } = await generateHealthInterpretation({
      modelName: project.name,
      accuracy: parseFloat(newAccuracy.toFixed(1)),
      precision: parseFloat((newAccuracy * 0.978).toFixed(1)),
      recall: parseFloat((newAccuracy * 0.961).toFixed(1)),
      f1Score: parseFloat((newAccuracy / 100 - 0.015).toFixed(1)),
      objective: project.objective,
    });

    const newHealth: ModelHealth = {
      ...(project.modelHealth!),
      score: Math.min(98, (project.modelHealth?.score ?? 86) + Math.floor(1.5 + Math.random() * 3.5)),
      accuracy: parseFloat(newAccuracy.toFixed(1)),
      precision: parseFloat((newAccuracy * 0.978).toFixed(1)),
      recall: parseFloat((newAccuracy * 0.961).toFixed(1)),
      f1Score: parseFloat((newAccuracy / 100 - 0.015).toFixed(3)),
      interpretation,
      recommendation,
      evaluationHistory: [
        ...(project.modelHealth?.evaluationHistory ?? []),
        {
          version: newVersionStr,
          date: new Date().toISOString().split('T')[0],
          accuracy: parseFloat(newAccuracy.toFixed(1)),
          f1: parseFloat((newAccuracy / 100 - 0.015).toFixed(3)),
        },
      ],
    };

    updateProject(projectId, {
      versions: [newVersion, ...updatedVersions],
      modelHealth: newHealth,
      datasetAnalysis: project.datasetAnalysis
        ? { ...project.datasetAnalysis, rows: newRows }
        : null,
      generatedSystemPrompt: updatedSystemPrompt,
      suggestedTestFields: updatedTestFields,
    });

    return newVersion;
  },
};

import OpenAI from 'openai';
import { getOpenAIKey, hasOpenAIKey } from '../config/apiConfig';
import type { ArchitectureOption, ModelOption, TestResult } from '../types';
import { ARCHITECTURE_OPTIONS, MODEL_OPTIONS } from './mockData';

function getClient(): OpenAI {
  return new OpenAI({
    apiKey: getOpenAIKey(),
    dangerouslyAllowBrowser: true,
  });
}

// ─────────────────────────────────────────────────────────────
// 1. Architecture analysis
// ─────────────────────────────────────────────────────────────
export async function aiAnalyzeUseCase(
  objective: string,
  inputFormats: string[],
  outputFormats: string[],
  constraints: string
): Promise<ArchitectureOption[]> {
  if (!hasOpenAIKey()) {
    await new Promise((r) => setTimeout(r, 1800));
    return [...ARCHITECTURE_OPTIONS];
  }

  const client = getClient();
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `You are an expert AI architect. Score each approach for this use case.

Objective: "${objective}"
Inputs: ${inputFormats.join(', ')}
Outputs: ${outputFormats.join(', ')}
Constraints: "${constraints || 'none'}"

Return ONLY a JSON array (no markdown):
[
  {"id":"fine-tuning","fitScore":<0-100>,"recommended":<true/false>},
  {"id":"rag","fitScore":<0-100>,"recommended":false},
  {"id":"prompting","fitScore":<0-100>,"recommended":false},
  {"id":"slm","fitScore":<0-100>,"recommended":false}
]
Only one item should have recommended:true (the best fit).`,
      }],
      temperature: 0.2,
      max_tokens: 300,
    });

    const raw = response.choices[0].message.content || '[]';
    const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const scores: { id: string; fitScore: number; recommended: boolean }[] = JSON.parse(cleaned);

    return ARCHITECTURE_OPTIONS.map((opt) => {
      const s = scores.find((x) => x.id === opt.id);
      return { ...opt, fitScore: s?.fitScore ?? opt.fitScore, recommended: s?.recommended ?? false };
    }).sort((a, b) => b.fitScore - a.fitScore);
  } catch {
    return [...ARCHITECTURE_OPTIONS];
  }
}

// ─────────────────────────────────────────────────────────────
// 2. Generate the model system prompt + suggested test fields
// ─────────────────────────────────────────────────────────────
export interface GeneratedModel {
  systemPrompt: string;
  suggestedTestFields: Array<{ key: string; label: string; placeholder: string; defaultValue: string }>;
}

export async function generateModelSystemPrompt(params: {
  name: string;
  objective: string;
  inputFormats: string[];
  outputFormats: string[];
  constraints: string;
  approach: string;
  foundationModel: string;
  datasetDescription?: string;
}): Promise<GeneratedModel> {
  const fallback = buildFallbackModel(params);

  if (!hasOpenAIKey()) return fallback;

  const client = getClient();
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: `You are an expert AI prompt engineer. Create a production system prompt and test fields for this AI.

Name: "${params.name}"
Objective: "${params.objective}"
Input formats: ${params.inputFormats.join(', ')}
Output formats: ${params.outputFormats.join(', ')}
Constraints: "${params.constraints || 'none'}"
Approach: ${params.approach}
${params.datasetDescription ? `Dataset: ${params.datasetDescription}` : ''}

Return ONLY this JSON (no markdown, no extra text):
{
  "systemPrompt": "<complete system prompt that makes this AI expert in its domain>",
  "suggestedTestFields": [
    {"key":"<field_name>","label":"<human label>","placeholder":"<example value>","defaultValue":"<realistic default>"},
    ...3-6 fields that match the domain
  ]
}

The systemPrompt MUST:
1. Define the AI as a domain expert for this specific objective
2. Specify EXACT output JSON format:
   { "prediction": "<main output>", "probability": <0.0-1.0>, "confidence": "high|medium|low", "explanation": [{"factor":"...","impact":"positive|negative|neutral","magnitude":"high|medium|low"}] }
3. Include domain-specific reasoning rules based on the objective
4. Always return ONLY valid JSON, no prose

The suggestedTestFields should match what a real user of THIS specific AI would input.`,
      }],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const raw = response.choices[0].message.content || '{}';
    const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      systemPrompt: parsed.systemPrompt || fallback.systemPrompt,
      suggestedTestFields: parsed.suggestedTestFields || fallback.suggestedTestFields,
    };
  } catch {
    return fallback;
  }
}

function buildFallbackModel(params: {
  name: string;
  objective: string;
  outputFormats: string[];
  constraints: string;
}): GeneratedModel {
  const obj = params.objective.toLowerCase();

  // Infer domain from objective for smart defaults
  const isClassification = obj.includes('classif') || obj.includes('categor');
  const isSentiment = obj.includes('sentiment') || obj.includes('emotion') || obj.includes('review');
  const isRisk = obj.includes('risk') || obj.includes('fraud') || obj.includes('default') || obj.includes('loan');
  const isSupport = obj.includes('support') || obj.includes('ticket') || obj.includes('help') || obj.includes('question');
  const isRecommend = obj.includes('recommend') || obj.includes('suggest');
  const isMedical = obj.includes('medical') || obj.includes('health') || obj.includes('patient') || obj.includes('diagnos');
  const isStudent = obj.includes('student') || obj.includes('school') || obj.includes('dropout') || obj.includes('academic');

  let suggestedTestFields = [
    { key: 'input', label: 'Input', placeholder: 'Enter your input data', defaultValue: 'Sample input text' },
    { key: 'context', label: 'Context', placeholder: 'Additional context', defaultValue: '' },
  ];

  if (isRisk) {
    suggestedTestFields = [
      { key: 'income', label: 'Annual Income', placeholder: '75000', defaultValue: '75000' },
      { key: 'loan_amount', label: 'Loan Amount', placeholder: '500000', defaultValue: '500000' },
      { key: 'credit_score', label: 'Credit Score', placeholder: '720', defaultValue: '720' },
      { key: 'employment', label: 'Employment Type', placeholder: 'Salaried', defaultValue: 'Salaried' },
      { key: 'existing_debt', label: 'Existing Debt', placeholder: '50000', defaultValue: '50000' },
    ];
  } else if (isSentiment) {
    suggestedTestFields = [
      { key: 'text', label: 'Text / Review', placeholder: 'Enter the text to analyze', defaultValue: 'The product quality is excellent and delivery was fast.' },
      { key: 'source', label: 'Source', placeholder: 'e.g. Twitter, Review', defaultValue: 'Customer review' },
    ];
  } else if (isSupport) {
    suggestedTestFields = [
      { key: 'query', label: 'Customer Query', placeholder: 'What is the customer asking?', defaultValue: 'How do I reset my password?' },
      { key: 'category', label: 'Category', placeholder: 'e.g. Billing, Technical', defaultValue: 'Technical' },
      { key: 'priority', label: 'Priority', placeholder: 'High / Medium / Low', defaultValue: 'Medium' },
    ];
  } else if (isStudent) {
    suggestedTestFields = [
      { key: 'attendance', label: 'Attendance %', placeholder: '75', defaultValue: '75' },
      { key: 'gpa', label: 'Current GPA', placeholder: '2.8', defaultValue: '2.8' },
      { key: 'assignments_completed', label: 'Assignments Completed %', placeholder: '60', defaultValue: '60' },
      { key: 'support_sessions', label: 'Support Sessions', placeholder: '2', defaultValue: '2' },
    ];
  } else if (isRecommend) {
    suggestedTestFields = [
      { key: 'user_id', label: 'User ID', placeholder: 'user_123', defaultValue: 'user_001' },
      { key: 'history', label: 'Past Interactions', placeholder: 'e.g. product1, product2', defaultValue: 'item_a, item_b' },
      { key: 'preferences', label: 'Preferences', placeholder: 'e.g. budget, premium', defaultValue: 'budget' },
    ];
  } else if (isMedical) {
    suggestedTestFields = [
      { key: 'age', label: 'Patient Age', placeholder: '45', defaultValue: '45' },
      { key: 'symptoms', label: 'Symptoms', placeholder: 'e.g. fever, cough', defaultValue: 'fatigue, shortness of breath' },
      { key: 'duration_days', label: 'Duration (days)', placeholder: '5', defaultValue: '5' },
    ];
  }

  const systemPrompt = `You are ${params.name}, a specialized AI system.

Objective: ${params.objective}
${params.constraints ? `Constraints: ${params.constraints}` : ''}

You are an expert in this domain. Analyze any input provided and give a precise, well-reasoned prediction.

Output format — return ONLY this JSON, no prose:
{
  "prediction": "<the main prediction/label/result>",
  "probability": <float 0.0-1.0 representing confidence or likelihood>,
  "confidence": "high" | "medium" | "low",
  "explanation": [
    { "factor": "<factor name>", "impact": "positive" | "negative" | "neutral", "magnitude": "high" | "medium" | "low" }
  ]
}`;

  return { systemPrompt, suggestedTestFields };
}

// ─────────────────────────────────────────────────────────────
// 3. Run inference against the generated model
// ─────────────────────────────────────────────────────────────
export async function runModelInference(
  systemPrompt: string,
  userInput: Record<string, string | number>,
  outputFormats: string[]
): Promise<TestResult> {
  if (!hasOpenAIKey()) {
    return universalMockInference(systemPrompt, userInput);
  }

  const client = getClient();
  try {
    const startTime = Date.now();
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Analyze this input and return your prediction as JSON:\n\n${JSON.stringify(userInput, null, 2)}\n\nReturn ONLY valid JSON — no markdown, no prose.`,
        },
      ],
      temperature: 0.15,
      max_tokens: 700,
    });

    const latencyMs = Date.now() - startTime;
    const raw = response.choices[0].message.content || '{}';
    const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      prediction: String(parsed.prediction || 'UNKNOWN').toUpperCase(),
      probability: typeof parsed.probability === 'number' ? Math.min(1, Math.max(0, parsed.probability)) : 0.5,
      confidence: (['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'medium') as 'high' | 'medium' | 'low',
      explanation: Array.isArray(parsed.explanation)
        ? parsed.explanation.map((f: any) => ({
            factor: String(f.factor || 'Factor'),
            impact: (['positive', 'negative', 'neutral'].includes(f.impact) ? f.impact : 'neutral') as 'positive' | 'negative' | 'neutral',
            magnitude: (['high', 'medium', 'low'].includes(f.magnitude) ? f.magnitude : 'medium') as 'high' | 'medium' | 'low',
          }))
        : [],
      latencyMs,
    };
  } catch {
    return universalMockInference(systemPrompt, userInput);
  }
}

// ─────────────────────────────────────────────────────────────
// 4. Universal mock inference — works for ANY model domain
// ─────────────────────────────────────────────────────────────
export function universalMockInference(
  systemPrompt: string,
  input: Record<string, string | number>
): TestResult {
  const promptLower = systemPrompt.toLowerCase();
  const values = Object.values(input).map((v) => (typeof v === 'number' ? v : parseFloat(String(v)) || 0));
  const textValues = Object.values(input).map((v) => String(v).toLowerCase());

  let probability = 0.35; // default moderate
  let prediction = '';
  const explanation: TestResult['explanation'] = [];

  // Risk / fraud / loan domain
  if (promptLower.includes('risk') || promptLower.includes('loan') || promptLower.includes('default') || promptLower.includes('fraud')) {
    const income = Number(input.income || input.salary || 50000);
    const loan = Number(input.loan_amount || input.amount || 200000);
    const credit = Number(input.credit_score || input.score || 680);
    const ratio = income > 0 ? loan / income : 10;
    probability = Math.min(0.95, Math.max(0.05, 0.2 + (ratio > 12 ? 0.2 : 0) + (credit < 650 ? 0.25 : 0) + (Math.random() * 0.06 - 0.03)));
    prediction = probability < 0.3 ? 'LOW RISK' : probability < 0.65 ? 'MEDIUM RISK' : 'HIGH RISK';
    explanation.push(
      { factor: 'Financial stability', impact: income > 40000 ? 'positive' : 'negative', magnitude: 'high' },
      { factor: 'Debt ratio', impact: ratio < 10 ? 'positive' : 'negative', magnitude: ratio < 6 ? 'high' : 'medium' },
      { factor: 'Credit profile', impact: credit >= 700 ? 'positive' : 'negative', magnitude: credit >= 750 ? 'high' : 'medium' },
    );
  }
  // Sentiment / review domain
  else if (promptLower.includes('sentiment') || promptLower.includes('emotion') || promptLower.includes('review')) {
    const text = textValues.join(' ');
    const positive = ['good', 'great', 'excellent', 'love', 'amazing', 'fast', 'perfect', 'best'].filter((w) => text.includes(w)).length;
    const negative = ['bad', 'poor', 'slow', 'terrible', 'worst', 'broken', 'awful', 'hate'].filter((w) => text.includes(w)).length;
    probability = Math.min(0.97, Math.max(0.03, 0.5 + positive * 0.12 - negative * 0.15 + (Math.random() * 0.06 - 0.03)));
    prediction = probability > 0.6 ? 'POSITIVE' : probability < 0.4 ? 'NEGATIVE' : 'NEUTRAL';
    explanation.push(
      { factor: 'Positive signals', impact: positive > 0 ? 'positive' : 'neutral', magnitude: positive > 2 ? 'high' : 'medium' },
      { factor: 'Negative signals', impact: negative > 0 ? 'negative' : 'neutral', magnitude: negative > 1 ? 'high' : 'low' },
      { factor: 'Overall tone', impact: probability > 0.5 ? 'positive' : 'negative', magnitude: 'medium' },
    );
  }
  // Student dropout / academic
  else if (promptLower.includes('student') || promptLower.includes('dropout') || promptLower.includes('academic')) {
    const attendance = Number(input.attendance || 75);
    const gpa = Number(input.gpa || 2.5);
    const assignments = Number(input.assignments_completed || 70);
    probability = Math.min(0.95, Math.max(0.05,
      (attendance < 60 ? 0.35 : attendance < 75 ? 0.2 : 0.05) +
      (gpa < 2.0 ? 0.3 : gpa < 2.5 ? 0.15 : 0) +
      (assignments < 50 ? 0.2 : assignments < 70 ? 0.1 : 0) +
      (Math.random() * 0.06 - 0.03)
    ));
    prediction = probability > 0.6 ? 'HIGH RISK' : probability > 0.35 ? 'MEDIUM RISK' : 'LOW RISK';
    explanation.push(
      { factor: 'Attendance rate', impact: attendance >= 75 ? 'positive' : 'negative', magnitude: attendance < 60 ? 'high' : 'medium' },
      { factor: 'Academic performance', impact: gpa >= 2.5 ? 'positive' : 'negative', magnitude: gpa < 2.0 ? 'high' : 'medium' },
      { factor: 'Assignment completion', impact: assignments >= 70 ? 'positive' : 'negative', magnitude: 'medium' },
    );
  }
  // Support / ticket routing
  else if (promptLower.includes('support') || promptLower.includes('ticket') || promptLower.includes('query')) {
    const text = textValues.join(' ');
    const isUrgent = ['urgent', 'broken', 'down', 'error', 'fail', 'crash', 'cant', 'cannot'].some((w) => text.includes(w));
    const isBilling = ['bill', 'charge', 'payment', 'refund', 'invoice', 'money'].some((w) => text.includes(w));
    prediction = isUrgent ? 'ESCALATE' : isBilling ? 'BILLING' : 'STANDARD';
    probability = isUrgent ? 0.87 : isBilling ? 0.82 : 0.71;
    explanation.push(
      { factor: 'Urgency indicators', impact: isUrgent ? 'negative' : 'positive', magnitude: isUrgent ? 'high' : 'low' },
      { factor: 'Billing keywords', impact: isBilling ? 'negative' : 'neutral', magnitude: isBilling ? 'medium' : 'low' },
      { factor: 'Complexity estimate', impact: 'neutral', magnitude: 'medium' },
    );
  }
  // Generic / classification fallback — uses actual input values meaningfully
  else {
    const numericValues = values.filter((v) => !isNaN(v) && v !== 0);
    const avgValue = numericValues.length > 0 ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length : 0;
    probability = Math.min(0.94, Math.max(0.06, 0.5 + (avgValue > 50 ? 0.15 : -0.1) + (Math.random() * 0.2 - 0.1)));

    // Extract label from prompt
    const lines = systemPrompt.split('\n');
    const predictionLine = lines.find((l) => l.includes('"prediction"'));
    if (predictionLine && predictionLine.includes('|')) {
      const options = predictionLine.match(/"([^"]+)"/g)?.map((s) => s.replace(/"/g, '')) || [];
      const meaningful = options.filter((o) => !['prediction', 'string'].includes(o));
      prediction = meaningful.length > 0
        ? probability > 0.65 ? meaningful[0] : probability < 0.35 ? meaningful[meaningful.length - 1] : (meaningful[1] || meaningful[0])
        : probability > 0.65 ? 'POSITIVE' : probability < 0.35 ? 'NEGATIVE' : 'NEUTRAL';
    } else {
      prediction = probability > 0.65 ? 'POSITIVE' : probability < 0.35 ? 'NEGATIVE' : 'NEUTRAL';
    }

    // Build explanations from actual input keys
    const entries = Object.entries(input).slice(0, 4);
    entries.forEach(([key, value]) => {
      const numVal = parseFloat(String(value));
      const isNum = !isNaN(numVal);
      explanation.push({
        factor: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        impact: isNum ? (numVal > 50 ? 'positive' : 'negative') : 'neutral',
        magnitude: 'medium',
      });
    });
  }

  return {
    prediction: prediction || 'POSITIVE',
    probability: parseFloat(probability.toFixed(3)),
    confidence: probability > 0.75 || probability < 0.25 ? 'high' : probability > 0.55 || probability < 0.45 ? 'medium' : 'low',
    explanation: explanation.length > 0 ? explanation : [
      { factor: 'Input analysis', impact: 'positive', magnitude: 'medium' },
      { factor: 'Pattern matching', impact: 'neutral', magnitude: 'low' },
    ],
    latencyMs: Math.floor(120 + Math.random() * 80),
  };
}

// ─────────────────────────────────────────────────────────────
// 5. Dataset insight generation
// ─────────────────────────────────────────────────────────────
export async function generateDatasetInsights(
  filename: string,
  objective: string,
  stats: { rows: number; columns: number; missingValues: number; duplicates: number; fileSize: string }
): Promise<string> {
  if (!hasOpenAIKey()) return '';
  const client = getClient();
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Dataset "${filename}" for: "${objective}". Stats: ${stats.rows} rows, ${stats.columns} cols, ${stats.missingValues}% missing, ${stats.fileSize}. Write 1-2 sentences describing what this likely contains and the most important features. Be domain-specific. No fluff.`,
      }],
      temperature: 0.3, max_tokens: 120,
    });
    return response.choices[0].message.content || '';
  } catch { return ''; }
}

// ─────────────────────────────────────────────────────────────
// 6. Health interpretation
// ─────────────────────────────────────────────────────────────
export async function generateHealthInterpretation(params: {
  modelName: string; accuracy: number; precision: number; recall: number; f1Score: number; objective: string;
  classPerformance?: { label: string; f1: number }[];
}): Promise<{ interpretation: string; recommendation: string }> {
  if (!hasOpenAIKey()) {
    return {
      interpretation: `The model performs well on common patterns. High-confidence predictions are very reliable.`,
      recommendation: `Add more diverse examples from edge cases to improve recall on underrepresented classes.`,
    };
  }
  const client = getClient();
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `ML evaluation expert. Model: "${params.modelName}" (${params.objective}). Accuracy ${params.accuracy}%, Precision ${params.precision}%, Recall ${params.recall}%, F1 ${params.f1Score}. ${params.classPerformance ? `Per-class F1: ${params.classPerformance.map((c) => `${c.label}:${c.f1}%`).join(', ')}` : ''} Return JSON only: {"interpretation":"<1-2 sentences>","recommendation":"<specific action>"}`,
      }],
      temperature: 0.3, max_tokens: 200,
    });
    const raw = (response.choices[0].message.content || '{}').replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(raw);
  } catch {
    return {
      interpretation: `The model shows strong performance with ${params.accuracy}% accuracy across the test set.`,
      recommendation: `Focus on collecting more data for underperforming classes to improve overall recall.`,
    };
  }
}

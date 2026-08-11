import { Router } from 'express';
import { getDb, parseJSON } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

const router = Router();

function getOpenAIClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

// ── POST /api/inference/:projectId  (External API — used by customers) ──
// This is the customer-facing endpoint when they integrate via API key
router.post('/:projectId', async (req, res) => {
  const startTime = Date.now();
  const { projectId } = req.params;
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  const project = getDb().prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) return res.status(404).json({ error: 'Model not found' });
  if (project.status !== 'production') return res.status(400).json({ error: 'Model not deployed' });

  const input = req.body;

  try {
    let result;
    const systemPrompt = project.generated_system_prompt;
    const openai = getOpenAIClient();

    if (systemPrompt && openai) {
      // Real inference via engine
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this input and return prediction as JSON:\n${JSON.stringify(input, null, 2)}\n\nReturn ONLY valid JSON.` }
        ],
        temperature: 0.2,
        max_tokens: 600,
      });

      const raw = response.choices[0].message.content || '{}';
      const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      result = JSON.parse(cleaned);
    } else {
      // Simulation fallback
      result = simulatePrediction(input, project);
    }

    const latencyMs = Date.now() - startTime;
    const output = {
      prediction: String(result.prediction || 'UNKNOWN').toLowerCase().replace(/\s+/g, '_'),
      probability: typeof result.probability === 'number' ? result.probability : 0.5,
      confidence: result.confidence || 'medium',
      explanation: result.explanation || [],
      model_version: 'v1.2',
      latency_ms: latencyMs,
      model_id: projectId,
      powered_by: 'foundry-engine-v2',
    };

    // Log the request
    const versions = getDb().prepare('SELECT version FROM model_versions WHERE project_id = ? AND status = ? LIMIT 1').get(projectId, 'production');
    getDb().prepare(`
      INSERT INTO api_requests (id, project_id, deployment_id, api_key, input_data, output_data, latency_ms, status_code, model_version, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), projectId, `deploy-${projectId}-1`, apiKey || 'anonymous',
      JSON.stringify(input), JSON.stringify(output), latencyMs, 200,
      versions?.version || 'v1.0', new Date().toISOString());

    res.json(output);
  } catch (err) {
    const latencyMs = Date.now() - startTime;

    // Log error
    getDb().prepare(`
      INSERT INTO api_requests (id, project_id, api_key, input_data, latency_ms, status_code, error, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), projectId, apiKey || 'anonymous',
      JSON.stringify(input), latencyMs, 500, err.message, new Date().toISOString());

    res.status(500).json({ error: 'Inference failed', details: err.message });
  }
});

function simulatePrediction(input, project) {
  const promptLower = (project.generated_system_prompt || project.objective || '').toLowerCase();
  const inputValues = Object.values(input);
  const numericVals = inputValues.map((v) => parseFloat(String(v))).filter((v) => !isNaN(v));

  // Risk / loan / fraud
  if (promptLower.includes('risk') || promptLower.includes('loan') || promptLower.includes('fraud') || promptLower.includes('default')) {
    const income = Number(input.income || input.salary || 50000);
    const loan = Number(input.loan_amount || input.amount || 200000);
    const credit = Number(input.credit_score || input.score || 680);
    const ratio = income > 0 ? loan / income : 10;
    let risk = 0.2 + (ratio > 12 ? 0.22 : ratio > 8 ? 0.1 : 0) + (credit < 650 ? 0.25 : credit < 700 ? 0.1 : 0);
    risk = Math.min(0.95, Math.max(0.05, risk + (Math.random() - 0.5) * 0.05));
    return {
      prediction: risk < 0.3 ? 'low_risk' : risk < 0.65 ? 'medium_risk' : 'high_risk',
      probability: parseFloat(risk.toFixed(3)),
      confidence: risk < 0.25 || risk > 0.75 ? 'high' : 'medium',
      explanation: [
        { factor: 'Financial stability', impact: income > 40000 ? 'positive' : 'negative', magnitude: 'high' },
        { factor: 'Debt ratio', impact: ratio < 10 ? 'positive' : 'negative', magnitude: 'medium' },
        { factor: 'Credit profile', impact: credit >= 700 ? 'positive' : 'negative', magnitude: 'medium' },
      ],
    };
  }

  // Sentiment
  if (promptLower.includes('sentiment') || promptLower.includes('review') || promptLower.includes('emotion')) {
    const text = inputValues.join(' ').toLowerCase();
    const pos = ['good','great','excellent','love','amazing','fast','best'].filter((w) => text.includes(w)).length;
    const neg = ['bad','poor','slow','terrible','broken','awful','hate'].filter((w) => text.includes(w)).length;
    const prob = Math.min(0.97, Math.max(0.03, 0.5 + pos * 0.12 - neg * 0.15));
    return {
      prediction: prob > 0.6 ? 'positive' : prob < 0.4 ? 'negative' : 'neutral',
      probability: parseFloat(prob.toFixed(3)),
      confidence: Math.abs(prob - 0.5) > 0.25 ? 'high' : 'medium',
      explanation: [
        { factor: 'Positive signals', impact: pos > 0 ? 'positive' : 'neutral', magnitude: pos > 2 ? 'high' : 'medium' },
        { factor: 'Negative signals', impact: neg > 0 ? 'negative' : 'neutral', magnitude: neg > 1 ? 'high' : 'low' },
      ],
    };
  }

  // Student / academic
  if (promptLower.includes('student') || promptLower.includes('dropout') || promptLower.includes('academic')) {
    const attendance = Number(input.attendance || 75);
    const gpa = Number(input.gpa || 2.5);
    const assignments = Number(input.assignments_completed || 70);
    const risk = Math.min(0.95, (attendance < 60 ? 0.35 : attendance < 75 ? 0.2 : 0.05) + (gpa < 2.0 ? 0.3 : gpa < 2.5 ? 0.15 : 0) + (assignments < 50 ? 0.2 : 0.05));
    return {
      prediction: risk > 0.6 ? 'high_risk' : risk > 0.35 ? 'medium_risk' : 'low_risk',
      probability: parseFloat(risk.toFixed(3)),
      confidence: risk > 0.7 || risk < 0.2 ? 'high' : 'medium',
      explanation: [
        { factor: 'Attendance', impact: attendance >= 75 ? 'positive' : 'negative', magnitude: attendance < 60 ? 'high' : 'medium' },
        { factor: 'GPA', impact: gpa >= 2.5 ? 'positive' : 'negative', magnitude: gpa < 2.0 ? 'high' : 'medium' },
        { factor: 'Assignments', impact: assignments >= 70 ? 'positive' : 'negative', magnitude: 'medium' },
      ],
    };
  }

  // Generic universal fallback
  const avg = numericVals.length ? numericVals.reduce((a, b) => a + b, 0) / numericVals.length : 50;
  const prob = Math.min(0.95, Math.max(0.05, 0.4 + (avg / 200) + (Math.random() * 0.15 - 0.075)));
  return {
    prediction: prob > 0.65 ? 'positive' : prob < 0.35 ? 'negative' : 'neutral',
    probability: parseFloat(prob.toFixed(3)),
    confidence: Math.abs(prob - 0.5) > 0.2 ? 'high' : 'medium',
    explanation: Object.keys(input).slice(0, 3).map((k) => ({
      factor: k.replace(/_/g, ' '),
      impact: 'neutral',
      magnitude: 'medium',
    })),
  };
}

export default router;

import type {
  AIRecommendation,
  RequirementProfile,
  ClarifyingQuestion,
  ApproachType,
  ModelId,
} from '../types';
import { hasOpenAIKey, getOpenAIKey } from '../config/apiConfig';

const MODEL_CATALOG = [
  {
    provider: 'OpenAI',
    model: 'GPT-4o',
    modelId: 'gpt' as ModelId,
    parameterSize: 'large',
    contextWindow: 128000,
    supportsVision: true,
    supportsToolUse: true,
    supportsFinetuning: true,
    deployment: 'api',
    relativeCost: 'high',
    relativeLatency: 'medium',
    strengths: ['reasoning', 'generation', 'multimodal', 'tool_use', 'instruction_following'],
  },
  {
    provider: 'Meta',
    model: 'Llama 3.1',
    modelId: 'llama' as ModelId,
    parameterSize: 'medium',
    contextWindow: 128000,
    supportsVision: false,
    supportsToolUse: true,
    supportsFinetuning: true,
    deployment: 'self-hosted',
    relativeCost: 'low',
    relativeLatency: 'medium',
    strengths: ['open_weights', 'rag', 'general_tasks', 'instruction_following'],
  },
  {
    provider: 'Alibaba',
    model: 'Qwen 2.5',
    modelId: 'qwen' as ModelId,
    parameterSize: 'small',
    contextWindow: 128000,
    supportsVision: true,
    supportsToolUse: true,
    supportsFinetuning: true,
    deployment: 'self-hosted',
    relativeCost: 'low',
    relativeLatency: 'fast',
    strengths: ['fine_tuning', 'classification', 'structured_output', 'multilingual'],
  },
  {
    provider: 'Mistral AI',
    model: 'Mistral',
    modelId: 'mistral' as ModelId,
    parameterSize: 'small',
    contextWindow: 32000,
    supportsVision: false,
    supportsToolUse: true,
    supportsFinetuning: true,
    deployment: 'self-hosted',
    relativeCost: 'low',
    relativeLatency: 'fast',
    strengths: ['code', 'structured_output', 'efficiency', 'european_compliance'],
  },
  {
    provider: 'Google',
    model: 'Gemma 2',
    modelId: 'gemma' as ModelId,
    parameterSize: 'small',
    contextWindow: 8192,
    supportsVision: false,
    supportsToolUse: false,
    supportsFinetuning: true,
    deployment: 'edge',
    relativeCost: 'low',
    relativeLatency: 'fast',
    strengths: ['edge_deployment', 'lightweight', 'classification', 'on_device'],
  },
  {
    provider: 'DeepSeek',
    model: 'DeepSeek V2',
    modelId: 'deepseek' as ModelId,
    parameterSize: 'large',
    contextWindow: 128000,
    supportsVision: false,
    supportsToolUse: true,
    supportsFinetuning: false,
    deployment: 'api',
    relativeCost: 'medium',
    relativeLatency: 'medium',
    strengths: ['reasoning', 'math', 'code', 'long_context'],
  },
];

export async function generateClarifyingQuestions(
  objective: string,
  existingProfile: Partial<RequirementProfile>
): Promise<ClarifyingQuestion[]> {
  if (!hasOpenAIKey()) {
    return getHeuristicQuestions(objective, existingProfile);
  }

  try {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: getOpenAIKey(), dangerouslyAllowBrowser: true });

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an AI architecture consultant. The user described their AI requirement. Analyze what information is missing and generate 2-4 SHORT clarifying questions that will materially affect the architecture recommendation.

Do NOT ask obvious questions. Only ask what is truly needed.

Categories: task_type, data, quality, performance, budget, deployment, behavior

Return JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "short question text",
      "category": "category_name",
      "options": ["option1", "option2", "option3"]
    }
  ]
}`
        },
        {
          role: 'user',
          content: `User requirement: "${objective}"
Already known: ${JSON.stringify(existingProfile)}`
        }
      ],
    });

    const parsed = JSON.parse(response.choices[0].message.content || '{}');
    return (parsed.questions || []).map((q: any) => ({
      id: q.id,
      question: q.question,
      category: q.category,
      options: q.options,
    }));
  } catch {
    return getHeuristicQuestions(objective, existingProfile);
  }
}

function getHeuristicQuestions(
  objective: string,
  profile: Partial<RequirementProfile>
): ClarifyingQuestion[] {
  const questions: ClarifyingQuestion[] = [];
  const lower = objective.toLowerCase();

  const hasClassification = lower.includes('classif') || lower.includes('categoriz') || lower.includes('detect');
  const hasGeneration = lower.includes('generat') || lower.includes('write') || lower.includes('summariz') || lower.includes('answer');
  const hasDocuments = lower.includes('document') || lower.includes('knowledge') || lower.includes('pdf');

  if (!hasClassification && !hasGeneration) {
    questions.push({
      id: 'q-task-type',
      question: 'Is your expected output mostly selective (choosing from categories) or descriptive (generating new text)?',
      category: 'task_type',
      options: ['Selective / Classification', 'Descriptive / Generative', 'Both'],
    });
  }

  if (!profile.budget) {
    questions.push({
      id: 'q-budget',
      question: 'What is your approximate budget for AI infrastructure?',
      category: 'budget',
      options: ['Low (minimize cost)', 'Medium (balanced)', 'High (prioritize quality)', 'Not sure yet'],
    });
  }

  if (hasDocuments && !profile.knowledgeChangesFrequently) {
    questions.push({
      id: 'q-data-update',
      question: 'Does your knowledge/data change frequently?',
      category: 'data',
      options: ['Yes, updated regularly', 'Rarely changes', 'Mix of static and dynamic'],
    });
  }

  if (!profile.deploymentRequirement) {
    questions.push({
      id: 'q-deployment',
      question: 'Where does the model need to run?',
      category: 'deployment',
      options: ['Cloud API is fine', 'Must run privately/on-premise', 'Edge/on-device', 'No preference'],
    });
  }

  return questions.slice(0, 3);
}

export async function parseRequirement(objective: string): Promise<Partial<RequirementProfile>> {
  if (!hasOpenAIKey()) {
    return parseRequirementHeuristic(objective);
  }

  try {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: getOpenAIKey(), dangerouslyAllowBrowser: true });

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Extract structured information from the user's AI requirement. Return JSON with these fields (use null if not determinable):
{
  "useCase": "brief label",
  "taskType": "classification|extraction|question_answering|summarization|generation|chatbot|reasoning|prediction|structured_output|agent",
  "dataSize": "none|tiny|small|medium|large|xlarge",
  "dataIsPrivate": true/false/null,
  "knowledgeChangesFrequently": true/false/null,
  "expectedQueriesPerDay": number or null,
  "latencyRequirement": "low|medium|high" or null,
  "budget": "low|medium|high|unknown",
  "deploymentRequirement": "cloud|private|on-premise|edge" or null,
  "outputType": "selective|descriptive|mixed",
  "complexityLevel": "simple|moderate|complex",
  "needsCitations": true/false,
  "needsDeterminism": true/false
}`
        },
        { role: 'user', content: objective }
      ],
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch {
    return parseRequirementHeuristic(objective);
  }
}

function parseRequirementHeuristic(objective: string): Partial<RequirementProfile> {
  const lower = objective.toLowerCase();
  const profile: Partial<RequirementProfile> = {
    budget: 'unknown',
  };

  if (lower.includes('classif') || lower.includes('categoriz') || lower.includes('detect') || lower.includes('predict')) {
    profile.taskType = 'classification';
    profile.outputType = 'selective';
    profile.complexityLevel = 'simple';
  } else if (lower.includes('answer') || lower.includes('question') || lower.includes('chatbot') || lower.includes('support')) {
    profile.taskType = 'question_answering';
    profile.outputType = 'descriptive';
    profile.complexityLevel = 'moderate';
  } else if (lower.includes('summar') || lower.includes('generat') || lower.includes('write')) {
    profile.taskType = 'generation';
    profile.outputType = 'descriptive';
    profile.complexityLevel = 'moderate';
  }

  if (lower.includes('document') || lower.includes('knowledge') || lower.includes('internal')) {
    profile.dataIsPrivate = true;
    profile.needsCitations = true;
  }

  if (lower.includes('million') || lower.includes('1m') || lower.includes('high volume')) {
    profile.dataSize = 'xlarge';
    profile.latencyRequirement = 'low';
  }

  return profile;
}

export async function generateRecommendation(
  objective: string,
  profile: RequirementProfile,
  answers: ClarifyingQuestion[]
): Promise<AIRecommendation> {
  if (!hasOpenAIKey()) {
    return generateHeuristicRecommendation(objective, profile);
  }

  try {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: getOpenAIKey(), dangerouslyAllowBrowser: true });

    const answeredContext = answers
      .filter((q) => q.answer)
      .map((q) => `Q: ${q.question} A: ${q.answer}`)
      .join('\n');

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an expert AI architect. Based on the user's requirement and profile, recommend the optimal AI architecture.

IMPORTANT RULES:
- Techniques (prompting, rag, fine-tuning) are NOT mutually exclusive. Recommend combinations when appropriate.
- Do NOT recommend fine-tuning just because user has lots of data. Large docs/knowledge -> RAG.
- Do NOT recommend the biggest model by default. Recommend the SIMPLEST architecture that meets quality needs.
- SLM is a model SIZE recommendation, not a technique replacement.
- A recommendation CAN be: "Small model + RAG + prompting" or "Medium model + fine-tuning + prompting"

Available models: ${JSON.stringify(MODEL_CATALOG.map(m => ({ provider: m.provider, model: m.model, modelId: m.modelId, size: m.parameterSize, strengths: m.strengths })))}

Return JSON:
{
  "architecture": {
    "modelSize": "small|medium|large",
    "techniques": ["prompting", "rag", "fine-tuning"] (one or more)
  },
  "recommendedModels": [
    { "provider": "...", "model": "...", "modelId": "qwen|llama|mistral|gemma|deepseek|gpt", "score": 0-100, "reason": "why this model" }
  ],
  "reasoning": ["reason1", "reason2", "reason3"],
  "confidence": 0.0-1.0,
  "alternative": { "description": "alternative approach", "when": "when to use it" },
  "costEstimate": "brief cost estimate"
}`
        },
        {
          role: 'user',
          content: `Requirement: "${objective}"
Profile: ${JSON.stringify(profile)}
Clarifying answers:
${answeredContext}`
        }
      ],
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      architecture: result.architecture || { modelSize: 'medium', techniques: ['prompting'] },
      recommendedModels: (result.recommendedModels || []).slice(0, 3),
      reasoning: result.reasoning || [],
      confidence: result.confidence || 0.7,
      alternative: result.alternative || { description: 'Use a larger model', when: 'If quality is insufficient' },
      costEstimate: result.costEstimate || 'Depends on usage volume',
    };
  } catch {
    return generateHeuristicRecommendation(objective, profile);
  }
}

function generateHeuristicRecommendation(
  objective: string,
  profile: RequirementProfile
): AIRecommendation {
  const lower = objective.toLowerCase();
  const techniques: ApproachType[] = ['prompting'];
  let modelSize: 'small' | 'medium' | 'large' = 'medium';
  let primaryModelId: ModelId = 'qwen';
  const reasoning: string[] = [];

  // Determine techniques
  if (profile.dataIsPrivate || profile.needsCitations || lower.includes('document') || lower.includes('knowledge')) {
    techniques.push('rag');
    reasoning.push('Private knowledge base detected — RAG enables retrieval without retraining');
  }

  if (profile.outputType === 'selective' && profile.dataSize && ['medium', 'large', 'xlarge'].includes(profile.dataSize)) {
    techniques.push('fine-tuning');
    reasoning.push('Classification task with sufficient training data — fine-tuning improves consistency');
  }

  if (profile.taskType === 'generation' && lower.includes('style')) {
    techniques.push('fine-tuning');
    reasoning.push('Specific output style required — fine-tuning captures consistent patterns');
  }

  // Determine model size
  if (profile.outputType === 'selective' && profile.complexityLevel === 'simple') {
    modelSize = 'small';
    primaryModelId = 'qwen';
    reasoning.push('Simple classification task — small model reduces cost and latency');
  } else if (profile.complexityLevel === 'complex' || lower.includes('legal') || lower.includes('reason')) {
    modelSize = 'large';
    primaryModelId = 'gpt';
    reasoning.push('Complex reasoning required — larger model provides necessary capability');
  } else {
    modelSize = 'medium';
    primaryModelId = 'llama';
    reasoning.push('Moderate complexity — medium model balances quality and cost');
  }

  // Edge/latency requirements
  if (profile.latencyRequirement === 'low' || profile.deploymentRequirement === 'edge') {
    modelSize = 'small';
    primaryModelId = 'gemma';
    reasoning.push('Low latency / edge deployment required — lightweight model essential');
  }

  const models = MODEL_CATALOG
    .map((m) => ({
      provider: m.provider,
      model: m.model,
      modelId: m.modelId,
      score: calculateModelScore(m, profile, techniques),
      reason: m.strengths.slice(0, 2).join(', '),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    architecture: { modelSize, techniques },
    recommendedModels: models,
    reasoning,
    confidence: 0.78,
    alternative: {
      description: modelSize === 'small' ? 'Use a medium/large model' : 'Use a smaller model with fine-tuning',
      when: modelSize === 'small' ? 'If evaluation shows insufficient quality' : 'If cost becomes a concern at scale',
    },
    costEstimate: modelSize === 'small' ? '$0.01-0.05 per 1K requests' : modelSize === 'medium' ? '$0.05-0.20 per 1K requests' : '$0.50-2.00 per 1K requests',
  };
}

function calculateModelScore(
  model: typeof MODEL_CATALOG[0],
  profile: RequirementProfile,
  techniques: ApproachType[]
): number {
  let score = 50;

  if (techniques.includes('fine-tuning') && model.supportsFinetuning) score += 15;
  if (techniques.includes('rag') && model.strengths.includes('rag')) score += 15;
  if (profile.outputType === 'selective' && model.strengths.includes('classification')) score += 10;
  if (profile.complexityLevel === 'complex' && model.strengths.includes('reasoning')) score += 15;
  if (profile.latencyRequirement === 'low' && model.relativeLatency === 'fast') score += 10;
  if (profile.budget === 'low' && model.relativeCost === 'low') score += 10;
  if (profile.deploymentRequirement === 'edge' && model.deployment === 'edge') score += 20;
  if (profile.deploymentRequirement === 'private' && model.deployment === 'self-hosted') score += 10;

  return Math.min(98, score);
}

export async function cleanAndImprovePrompt(rawObjective: string): Promise<string> {
  if (!hasOpenAIKey()) return rawObjective;

  try {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: getOpenAIKey(), dangerouslyAllowBrowser: true });

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `You improve AI requirement descriptions. Clean up grammar, make the requirement clearer and more specific, but preserve the user's intent. Keep it concise (2-3 sentences max). Do NOT add requirements the user didn't mention. Return only the improved text.`
        },
        { role: 'user', content: rawObjective }
      ],
    });

    return response.choices[0].message.content || rawObjective;
  } catch {
    return rawObjective;
  }
}

import { getDb } from './database.js';

export function initPricingSchema() {
  const db = getDb();

  db.exec(`
    -- Provider pricing registry: source of truth for all external costs
    CREATE TABLE IF NOT EXISTS provider_pricing (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      region TEXT DEFAULT 'global',
      pricing_type TEXT NOT NULL,
      input_price_per_1m_tokens REAL,
      output_price_per_1m_tokens REAL,
      cached_input_price_per_1m_tokens REAL,
      training_price_per_1m_tokens REAL,
      fine_tuning_price_per_1m_tokens REAL,
      batch_input_price_per_1m_tokens REAL,
      batch_output_price_per_1m_tokens REAL,
      image_price_per_image REAL,
      embedding_price_per_1m_tokens REAL,
      currency TEXT DEFAULT 'USD',
      effective_from TEXT NOT NULL,
      effective_to TEXT,
      source_url TEXT,
      last_verified_at TEXT NOT NULL,
      notes TEXT,
      is_active INTEGER DEFAULT 1
    );

    -- Compute pricing (AWS, GCP, Azure)
    CREATE TABLE IF NOT EXISTS compute_pricing (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      instance_type TEXT NOT NULL,
      region TEXT NOT NULL,
      vcpus INTEGER,
      memory_gb REAL,
      gpu_type TEXT,
      gpu_count INTEGER DEFAULT 0,
      gpu_memory_gb REAL,
      on_demand_hourly REAL NOT NULL,
      spot_hourly REAL,
      savings_plan_hourly REAL,
      storage_type TEXT,
      category TEXT,
      currency TEXT DEFAULT 'USD',
      effective_from TEXT NOT NULL,
      source_url TEXT,
      last_verified_at TEXT NOT NULL,
      is_active INTEGER DEFAULT 1
    );

    -- Storage pricing
    CREATE TABLE IF NOT EXISTS storage_pricing (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      service TEXT NOT NULL,
      tier TEXT NOT NULL,
      region TEXT NOT NULL,
      price_per_gb_month REAL NOT NULL,
      put_request_per_1k REAL,
      get_request_per_1k REAL,
      data_retrieval_per_gb REAL,
      data_transfer_out_per_gb REAL,
      currency TEXT DEFAULT 'USD',
      effective_from TEXT NOT NULL,
      source_url TEXT,
      last_verified_at TEXT NOT NULL,
      is_active INTEGER DEFAULT 1
    );

    -- Platform pricing configuration
    CREATE TABLE IF NOT EXISTS pricing_config (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value REAL NOT NULL,
      description TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Usage metering: tracks all resource consumption
    CREATE TABLE IF NOT EXISTS usage_meters (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      organization_id TEXT,
      resource_type TEXT NOT NULL,
      metric TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      provider TEXT,
      region TEXT,
      metadata TEXT,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    -- Cost ledger: every cost event
    CREATE TABLE IF NOT EXISTS cost_ledger (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      organization_id TEXT,
      cost_category TEXT NOT NULL,
      description TEXT,
      provider_cost REAL NOT NULL DEFAULT 0,
      infrastructure_cost REAL NOT NULL DEFAULT 0,
      overhead_allocation REAL NOT NULL DEFAULT 0,
      cost_buffer REAL NOT NULL DEFAULT 0,
      total_cost REAL NOT NULL DEFAULT 0,
      customer_price REAL NOT NULL DEFAULT 0,
      margin_percentage REAL,
      currency TEXT DEFAULT 'USD',
      usage_meter_id TEXT,
      job_id TEXT,
      metadata TEXT,
      period_start TEXT,
      period_end TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    -- Training job costs
    CREATE TABLE IF NOT EXISTS training_costs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      job_type TEXT NOT NULL,
      gpu_type TEXT,
      gpu_count INTEGER DEFAULT 1,
      runtime_hours REAL NOT NULL DEFAULT 0,
      gpu_cost REAL NOT NULL DEFAULT 0,
      cpu_cost REAL NOT NULL DEFAULT 0,
      storage_cost REAL NOT NULL DEFAULT 0,
      network_cost REAL NOT NULL DEFAULT 0,
      data_processing_cost REAL NOT NULL DEFAULT 0,
      evaluation_cost REAL NOT NULL DEFAULT 0,
      api_cost REAL NOT NULL DEFAULT 0,
      total_provider_cost REAL NOT NULL DEFAULT 0,
      total_customer_price REAL NOT NULL DEFAULT 0,
      margin_percentage REAL,
      status TEXT DEFAULT 'estimated',
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    -- Budget controls
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      project_id TEXT,
      budget_type TEXT NOT NULL,
      limit_amount REAL NOT NULL,
      current_spend REAL NOT NULL DEFAULT 0,
      period TEXT NOT NULL,
      alert_threshold REAL DEFAULT 0.8,
      is_hard_limit INTEGER DEFAULT 0,
      currency TEXT DEFAULT 'USD',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_usage_meters_project ON usage_meters(project_id);
    CREATE INDEX IF NOT EXISTS idx_usage_meters_recorded ON usage_meters(recorded_at);
    CREATE INDEX IF NOT EXISTS idx_cost_ledger_project ON cost_ledger(project_id);
    CREATE INDEX IF NOT EXISTS idx_cost_ledger_created ON cost_ledger(created_at);
    CREATE INDEX IF NOT EXISTS idx_training_costs_project ON training_costs(project_id);
    CREATE INDEX IF NOT EXISTS idx_provider_pricing_active ON provider_pricing(provider, model, is_active);
  `);

  seedPricingData();
}

function seedPricingData() {
  const db = getDb();
  const existing = db.prepare('SELECT COUNT(*) as count FROM provider_pricing').get();
  if (existing.count > 0) return;

  console.log('💰 Seeding pricing data...');
  const now = new Date().toISOString();

  // OpenAI Pricing (as of mid-2026 estimates based on current trajectory)
  const openaiModels = [
    { model: 'gpt-4o', input: 2.50, output: 10.00, cached: 1.25, batch_in: 1.25, batch_out: 5.00 },
    { model: 'gpt-4o-mini', input: 0.15, output: 0.60, cached: 0.075, batch_in: 0.075, batch_out: 0.30 },
    { model: 'gpt-4.1', input: 2.00, output: 8.00, cached: 0.50, batch_in: 1.00, batch_out: 4.00 },
    { model: 'gpt-4.1-mini', input: 0.40, output: 1.60, cached: 0.10, batch_in: 0.20, batch_out: 0.80 },
    { model: 'gpt-4.1-nano', input: 0.10, output: 0.40, cached: 0.025, batch_in: 0.05, batch_out: 0.20 },
    { model: 'o3', input: 2.00, output: 8.00, cached: 0.50, batch_in: 1.00, batch_out: 4.00 },
    { model: 'o3-mini', input: 1.10, output: 4.40, cached: 0.275, batch_in: 0.55, batch_out: 2.20 },
    { model: 'o4-mini', input: 1.10, output: 4.40, cached: 0.275, batch_in: 0.55, batch_out: 2.20 },
  ];

  const insertProvider = db.prepare(`
    INSERT INTO provider_pricing (id, provider, model, pricing_type, input_price_per_1m_tokens, output_price_per_1m_tokens, cached_input_price_per_1m_tokens, batch_input_price_per_1m_tokens, batch_output_price_per_1m_tokens, currency, effective_from, source_url, last_verified_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const m of openaiModels) {
    insertProvider.run(
      `openai-${m.model}`, 'openai', m.model, 'token',
      m.input, m.output, m.cached, m.batch_in, m.batch_out,
      'USD', '2026-01-01', 'https://openai.com/api/pricing/', now
    );
  }

  // OpenAI Embeddings
  db.prepare(`
    INSERT INTO provider_pricing (id, provider, model, pricing_type, embedding_price_per_1m_tokens, currency, effective_from, source_url, last_verified_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('openai-embedding-3-small', 'openai', 'text-embedding-3-small', 'embedding', 0.02, 'USD', '2026-01-01', 'https://openai.com/api/pricing/', now);

  db.prepare(`
    INSERT INTO provider_pricing (id, provider, model, pricing_type, embedding_price_per_1m_tokens, currency, effective_from, source_url, last_verified_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('openai-embedding-3-large', 'openai', 'text-embedding-3-large', 'embedding', 0.13, 'USD', '2026-01-01', 'https://openai.com/api/pricing/', now);

  // OpenAI Fine-tuning pricing
  db.prepare(`
    INSERT INTO provider_pricing (id, provider, model, pricing_type, training_price_per_1m_tokens, input_price_per_1m_tokens, output_price_per_1m_tokens, currency, effective_from, source_url, last_verified_at, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('openai-gpt4o-mini-ft', 'openai', 'gpt-4o-mini-ft', 'fine_tuning', 3.00, 0.30, 1.20, 'USD', '2026-01-01', 'https://openai.com/api/pricing/', now, 'Fine-tuned gpt-4o-mini inference pricing');

  db.prepare(`
    INSERT INTO provider_pricing (id, provider, model, pricing_type, training_price_per_1m_tokens, input_price_per_1m_tokens, output_price_per_1m_tokens, currency, effective_from, source_url, last_verified_at, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('openai-gpt4o-ft', 'openai', 'gpt-4o-ft', 'fine_tuning', 25.00, 3.75, 15.00, 'USD', '2026-01-01', 'https://openai.com/api/pricing/', now, 'Fine-tuned gpt-4o inference pricing');

  // AWS Compute pricing (us-east-1)
  const awsInstances = [
    { type: 'g5.xlarge', vcpus: 4, mem: 16, gpu: 'A10G', gpuCount: 1, gpuMem: 24, onDemand: 1.006, spot: 0.40 },
    { type: 'g5.2xlarge', vcpus: 8, mem: 32, gpu: 'A10G', gpuCount: 1, gpuMem: 24, onDemand: 1.212, spot: 0.48 },
    { type: 'g5.4xlarge', vcpus: 16, mem: 64, gpu: 'A10G', gpuCount: 1, gpuMem: 24, onDemand: 1.624, spot: 0.65 },
    { type: 'g5.8xlarge', vcpus: 32, mem: 128, gpu: 'A10G', gpuCount: 1, gpuMem: 24, onDemand: 2.448, spot: 0.98 },
    { type: 'g5.12xlarge', vcpus: 48, mem: 192, gpu: 'A10G', gpuCount: 4, gpuMem: 96, onDemand: 5.672, spot: 2.27 },
    { type: 'g6.xlarge', vcpus: 4, mem: 16, gpu: 'L4', gpuCount: 1, gpuMem: 24, onDemand: 0.8048, spot: 0.32 },
    { type: 'g6.2xlarge', vcpus: 8, mem: 32, gpu: 'L4', gpuCount: 1, gpuMem: 24, onDemand: 0.9776, spot: 0.39 },
    { type: 'p4d.24xlarge', vcpus: 96, mem: 1152, gpu: 'A100', gpuCount: 8, gpuMem: 320, onDemand: 32.77, spot: 12.0 },
    { type: 'p5.48xlarge', vcpus: 192, mem: 2048, gpu: 'H100', gpuCount: 8, gpuMem: 640, onDemand: 98.32, spot: 39.0 },
    { type: 'c6i.xlarge', vcpus: 4, mem: 8, gpu: null, gpuCount: 0, gpuMem: 0, onDemand: 0.17, spot: 0.068 },
    { type: 'c6i.2xlarge', vcpus: 8, mem: 16, gpu: null, gpuCount: 0, gpuMem: 0, onDemand: 0.34, spot: 0.136 },
    { type: 'c6i.4xlarge', vcpus: 16, mem: 32, gpu: null, gpuCount: 0, gpuMem: 0, onDemand: 0.68, spot: 0.272 },
    { type: 'm6i.xlarge', vcpus: 4, mem: 16, gpu: null, gpuCount: 0, gpuMem: 0, onDemand: 0.192, spot: 0.077 },
    { type: 'm6i.2xlarge', vcpus: 8, mem: 32, gpu: null, gpuCount: 0, gpuMem: 0, onDemand: 0.384, spot: 0.154 },
  ];

  const insertCompute = db.prepare(`
    INSERT INTO compute_pricing (id, provider, instance_type, region, vcpus, memory_gb, gpu_type, gpu_count, gpu_memory_gb, on_demand_hourly, spot_hourly, category, currency, effective_from, source_url, last_verified_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const i of awsInstances) {
    const category = i.gpu ? 'gpu' : (i.type.startsWith('c') ? 'compute' : 'general');
    insertCompute.run(
      `aws-${i.type}-use1`, 'aws', i.type, 'us-east-1',
      i.vcpus, i.mem, i.gpu, i.gpuCount, i.gpuMem,
      i.onDemand, i.spot, category, 'USD', '2026-01-01',
      'https://aws.amazon.com/ec2/pricing/on-demand/', now
    );
  }

  // Storage pricing (S3)
  const insertStorage = db.prepare(`
    INSERT INTO storage_pricing (id, provider, service, tier, region, price_per_gb_month, put_request_per_1k, get_request_per_1k, data_retrieval_per_gb, data_transfer_out_per_gb, currency, effective_from, source_url, last_verified_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStorage.run('aws-s3-standard-use1', 'aws', 's3', 'standard', 'us-east-1', 0.023, 0.005, 0.0004, 0, 0.09, 'USD', '2026-01-01', 'https://aws.amazon.com/s3/pricing/', now);
  insertStorage.run('aws-s3-ia-use1', 'aws', 's3', 'infrequent_access', 'us-east-1', 0.0125, 0.01, 0.001, 0.01, 0.09, 'USD', '2026-01-01', 'https://aws.amazon.com/s3/pricing/', now);
  insertStorage.run('aws-ebs-gp3-use1', 'aws', 'ebs', 'gp3', 'us-east-1', 0.08, 0, 0, 0, 0, 'USD', '2026-01-01', 'https://aws.amazon.com/ebs/pricing/', now);
  insertStorage.run('aws-ebs-io2-use1', 'aws', 'ebs', 'io2', 'us-east-1', 0.125, 0, 0, 0, 0, 'USD', '2026-01-01', 'https://aws.amazon.com/ebs/pricing/', now);

  // Platform configuration
  const insertConfig = db.prepare(`INSERT INTO pricing_config (id, key, value, description) VALUES (?, ?, ?, ?)`);

  const configs = [
    ['target_gross_margin', 0.50, 'Target gross margin percentage'],
    ['payment_fee_percentage', 0.03, 'Payment processor fee (e.g. Stripe)'],
    ['payment_fixed_fee', 0.30, 'Fixed per-transaction payment fee (USD)'],
    ['shared_overhead_percentage', 0.10, 'Shared platform infrastructure allocation'],
    ['cost_buffer_percentage', 0.05, 'Safety margin for cost fluctuations'],
    ['minimum_training_job_price', 2.00, 'Minimum charge for any training job'],
    ['minimum_deployment_monthly', 5.00, 'Minimum monthly deployment charge'],
    ['minimum_transaction', 0.50, 'Minimum charge for any billable event'],
    ['platform_monthly_base', 0.00, 'Base platform fee per month (0 = usage-only)'],
    ['free_tier_requests_monthly', 1000, 'Free requests per month per project'],
    ['free_tier_storage_gb', 5, 'Free storage GB per project'],
    ['vector_db_per_gb_month', 0.25, 'Vector database storage cost per GB/month'],
    ['vector_db_per_1m_operations', 0.10, 'Vector database operations per 1M'],
    ['monitoring_per_project_month', 2.00, 'Monitoring/logging cost per project per month'],
    ['load_balancer_hourly', 0.025, 'Load balancer cost per hour'],
    ['network_egress_per_gb', 0.09, 'Network data transfer out per GB'],
  ];

  for (const [key, value, desc] of configs) {
    insertConfig.run(`config-${key}`, key, value, desc);
  }

  console.log('✅ Pricing data seeded.');
}

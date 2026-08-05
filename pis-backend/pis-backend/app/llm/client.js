// ── LLM CLIENT ────────────────────────────────────
// requirement: custom 200-line client
// Two providers: Anthropic (primary) + fallback
// Three call types: extract_json, generate_text, embed
// Tracks cost on every call

const { jsonrepair } = require('jsonrepair');
const Anthropic = require('@anthropic-ai/sdk');
const LLMCall = require('../models/LLMCall');

// Model cost per 1000 tokens (USD)
// Used to calculate cost of every call
const MODEL_COSTS = {
  'claude-haiku-4-5': {
    input: 0.00025,   // $0.25 per million tokens
    output: 0.00125   // $1.25 per million tokens
  },
  'claude-sonnet-4-6': {
    input: 0.003,     // $3 per million tokens
    output: 0.015     // $15 per million tokens
  }
};

class LLMClient {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  // ── Calculate cost ────────────────────────────
  calculateCost(model, inputTokens, outputTokens) {
    const costs = MODEL_COSTS[model];
    if (!costs) return 0;
    return (
      (inputTokens / 1000) * costs.input +
      (outputTokens / 1000) * costs.output
    );
  }

  // ── Log every AI call to MongoDB ──────────────
  // Sir's requirement: track all calls for cost monitoring
  async logCall(data) {
    try {
      await LLMCall.create(data);
    } catch (err) {
      // Don't crash if logging fails
      console.error('Log error:', err.message);
    }
  }

  // ── CALL TYPE 1: extract_json ─────────────────
  // Use for: Brief interpretation, competency mapping
  // Always returns parsed JSON or throws
  async extract_json({
    prompt,
    tenantId = null,
    opportunityId = null,
    agent = 'unknown',
    maxRetries = 2
  }) {
    const startTime = Date.now();
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.anthropic.messages.create({
          model: prompt.model,
          max_tokens: prompt.max_tokens,
          temperature: prompt.temperature,
          system: prompt.system,
          messages: [{ role: 'user', content: prompt.userMessage }]
        });

        const rawText = response.content[0].text;
        const latency = Date.now() - startTime;
        const cost = this.calculateCost(
          prompt.model,
          response.usage.input_tokens,
          response.usage.output_tokens
        );

        // Log to MongoDB
        await this.logCall({
          tenant_id: tenantId,
          opportunity_id: opportunityId,
          agent,
          model: prompt.model,
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
          cost_usd: cost,
          latency_ms: latency,
          success: true
        });

        console.log(`✅ ${agent} | ${prompt.model} | ${response.usage.input_tokens}in/${response.usage.output_tokens}out | $${cost.toFixed(5)} | ${latency}ms`);

        // Parse JSON safely
        const cleaned = rawText.replace(/```json|```/g, '').trim();

        console.log('\n================ RAW RESPONSE ================\n');
        console.log(cleaned);
        console.log('\n==============================================\n');

        try {
          return JSON.parse(cleaned);
        } catch (err) {
          console.log('⚠️ Invalid JSON detected. Attempting repair...');
          const repaired = jsonrepair(cleaned);
          return JSON.parse(repaired);
        }
      } catch (err) {
        lastError = err;
        console.warn(`⚠️ ${agent} attempt ${attempt + 1} failed: ${err.message}`);

        // Log failed attempt
        await this.logCall({
          tenant_id: tenantId,
          opportunity_id: opportunityId,
          agent,
          model: prompt.model,
          input_tokens: 0,
          output_tokens: 0,
          cost_usd: 0,
          latency_ms: Date.now() - startTime,
          success: false,
          error: err.message
        });

        // Wait before retry
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    throw new Error(`${agent} failed after ${maxRetries + 1} attempts: ${lastError?.message}`);
  }

  // ── CALL TYPE 2: generate_text ────────────────
  // Use for: Approach note, question generation
  // Returns plain text string
  async generate_text({
    prompt,
    tenantId = null,
    opportunityId = null,
    agent = 'unknown'
  }) {
    const startTime = Date.now();

    try {
      const response = await this.anthropic.messages.create({
        model: prompt.model,
        max_tokens: prompt.max_tokens,
        temperature: prompt.temperature,
        system: prompt.system,
        messages: [{ role: 'user', content: prompt.userMessage }]
      });

      const text = response.content[0].text;
      const latency = Date.now() - startTime;
      const cost = this.calculateCost(
        prompt.model,
        response.usage.input_tokens,
        response.usage.output_tokens
      );

      await this.logCall({
        tenant_id: tenantId,
        opportunity_id: opportunityId,
        agent,
        model: prompt.model,
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        cost_usd: cost,
        latency_ms: latency,
        success: true
      });

      console.log(`✅ ${agent} | ${prompt.model} | $${cost.toFixed(5)} | ${latency}ms`);
      return text;

    } catch (err) {
      await this.logCall({
        tenant_id: tenantId,
        opportunity_id: opportunityId,
        agent,
        model: prompt.model,
        input_tokens: 0, output_tokens: 0, cost_usd: 0,
        latency_ms: Date.now() - startTime,
        success: false, error: err.message
      });
      throw err;
    }
  }
}

// Export a single instance — used everywhere
module.exports = new LLMClient();
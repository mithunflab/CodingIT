import { createClient } from '@supabase/supabase-js';
import { pipeline } from '@xenova/transformers';

// Configuration
const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Singleton pattern for the embedding pipeline
let embeddingPipeline: any = null;
async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    embeddingPipeline = await pipeline('feature-extraction', EMBEDDING_MODEL);
  }
  return embeddingPipeline;
}

// Function to retrieve relevant code snippets
export async function retrieveRelevantCode(query: string, match_threshold = 0.75, match_count = 5) {
  try {
    const pipeline = await getEmbeddingPipeline();

    // 1. Generate an embedding for the user's query
    const queryEmbedding = await pipeline(query, {
      pooling: 'mean',
      normalize: true,
    });

    // 2. Query Supabase for similar embeddings
    const { data, error } = await supabase.rpc('match_code_embeddings', {
      query_embedding: Array.from(queryEmbedding.data),
      match_threshold,
      match_count,
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      return [];
    }

    return data.map((item: any) => item.content);
  } catch (error) {
    console.error('Error during code retrieval:', error);
    return [];
  }
}

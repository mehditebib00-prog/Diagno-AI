package com.diagnoai.ai;

import com.diagnoai.config.RAGconfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RAGservice {

    @Autowired
    private RAGconfig config;

    @Autowired
    private MCPContextBuilder mcpContextBuilder;

    private final ObjectMapper mapper = new ObjectMapper();

    // ── RestTemplate with long timeout for Ollama generation ─────────────
    // Default RestTemplate times out in ~3s — way too short for a local LLM.
    // We set 3 minutes connect + 5 minutes read to be safe.
    private final RestTemplate restTemplate = buildRestTemplate();

    private static RestTemplate buildRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);   // 10 seconds to connect
        factory.setReadTimeout(300_000);     // 5 minutes to read (LLM generation)
        return new RestTemplate(factory);
    }

    /** In-memory chunk store */
    private List<Map<String, Object>> chunks = new ArrayList<>();

    // ── Startup ───────────────────────────────────────────────────────────

    @PostConstruct
    public void load() {
        reload();
    }

    public void reload() {
        String path = config.getRag().getKnowledgeBasePath();
        File file = new File(path);

        if (!file.exists()) {
            System.out.println("[RAGService] No knowledge base at '" + path
                    + "'. POST /api/rag/rebuild to generate it.");
            chunks = new ArrayList<>();
            return;
        }

        try {
            JsonNode root  = mapper.readTree(file);
            JsonNode items = root.get("chunks");
            if (items == null || !items.isArray()) {
                System.err.println("[RAGService] 'chunks' array missing.");
                return;
            }

            List<Map<String, Object>> loaded = new ArrayList<>();
            for (JsonNode item : items) {
                Map<String, Object> chunk = new HashMap<>();
                chunk.put("id",          item.get("id").asText());
                chunk.put("text",        item.get("text").asText());
                chunk.put("source_file", item.get("source_file").asText());
                chunk.put("record_id",   item.get("record_id").asText());

                List<Double> embedding = new ArrayList<>();
                for (JsonNode v : item.get("embedding")) {
                    embedding.add(v.asDouble());
                }
                chunk.put("embedding", embedding);
                loaded.add(chunk);
            }

            this.chunks = loaded;
            System.out.println("[RAGService] Loaded " + chunks.size() + " chunks.");

        } catch (Exception e) {
            System.err.println("[RAGService] Load error: " + e.getMessage());
        }
    }

    // ── Public API ────────────────────────────────────────────────────────

    public String retrieveContext(String query) {
        if (chunks.isEmpty()) {
            return "[RAG] Knowledge base empty. POST /api/rag/rebuild to generate it.";
        }

        List<Double> queryEmbedding = embed(query);
        if (queryEmbedding.isEmpty()) {
            return "[RAG] Could not embed query — is Ollama running?";
        }

        int topK = config.getRag().getTopK();

        List<Map.Entry<Double, Map<String, Object>>> scored = chunks.stream()
            .map(chunk -> {
                @SuppressWarnings("unchecked")
                List<Double> emb = (List<Double>) chunk.get("embedding");
                return Map.entry(cosineSimilarity(queryEmbedding, emb), chunk);
            })
            .sorted((a, b) -> Double.compare(b.getKey(), a.getKey()))
            .limit(topK)
            .collect(Collectors.toList());

        StringBuilder context = new StringBuilder("=== Relevant Medical Knowledge ===\n\n");
        for (int i = 0; i < scored.size(); i++) {
            Map<String, Object> chunk = scored.get(i).getValue();
            context.append("--- Source ").append(i + 1)
                   .append(": ").append(chunk.get("source_file")).append(" ---\n")
                   .append(chunk.get("text")).append("\n\n");
        }
        return context.toString();
    }

    public boolean isLoaded()    { return !chunks.isEmpty(); }
    public int getChunkCount()   { return chunks.size(); }

    // ── Main answer method ────────────────────────────────────────────────

    public String answer(String question, Long patientId) {
        String patientContext = mcpContextBuilder.getPatientContext(patientId);
        String ragContext     = retrieveContext(question);

        String prompt = """
                SYSTEM:
                You are a medical assistant. Answer only using the provided context.
                Rules:
                - Use only patient context and medical knowledge below
                - If unsure, say you are not certain
                - Be concise and medical
                - Always respond in the same language as the USER QUESTION

                PATIENT CONTEXT:
                %s

                MEDICAL KNOWLEDGE:
                %s

                USER QUESTION:
                %s

                ANSWER:
                """.formatted(patientContext, ragContext, question);

        return chat(prompt);
    }

    // ── Ollama chat ───────────────────────────────────────────────────────

    private String chat(String prompt) {
        String url = config.getOllama().getBaseUrl() + "/api/generate";

        Map<String, Object> body = new HashMap<>();
        body.put("model",  config.getOllama().getChatModel());
        body.put("prompt", prompt);
        body.put("stream", false);
        body.put("options", Map.of(
            "num_predict", 4096,   // ← was 1500, raised to allow full responses
            "temperature", 0.3     // ← lower = more focused medical answers
        ));

        // Force UTF-8 on the request so French/Arabic chars aren't mangled
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("application", "json", StandardCharsets.UTF_8));

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                url, new HttpEntity<>(body, headers), String.class);

            if (response.getBody() == null) {
                return "Error: empty response from Ollama";
            }

            JsonNode json = mapper.readTree(response.getBody());

            // Log finish reason to help debug truncation
            String finishReason = json.has("done_reason")
                ? json.get("done_reason").asText() : "unknown";
            System.out.println("[RAGService] Ollama finish reason: " + finishReason);

            return json.get("response").asText();

        } catch (Exception e) {
            System.err.println("[RAGService] Chat error: " + e.getMessage());
            return "Error: " + e.getMessage();
        }
    }

    // ── Ollama embed ──────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private List<Double> embed(String text) {
        try {
            String url = config.getOllama().getBaseUrl() + "/api/embeddings";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(new MediaType("application", "json", StandardCharsets.UTF_8));

            Map<String, String> body = Map.of(
                "model",  config.getOllama().getEmbedModel(),
                "prompt", text
            );

            ResponseEntity<Map> response = restTemplate.postForEntity(
                url, new HttpEntity<>(body, headers), Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Object raw = response.getBody().get("embedding");
                if (raw instanceof List<?> list) {
                    return list.stream()
                        .map(v -> ((Number) v).doubleValue())
                        .toList();
                }
            }
        } catch (Exception e) {
            System.err.println("[RAGService] Embed error: " + e.getMessage());
        }
        return Collections.emptyList();
    }

    // ── Math ──────────────────────────────────────────────────────────────

    private double cosineSimilarity(List<Double> a, List<Double> b) {
        if (a.size() != b.size()) return 0.0;
        double dot = 0, magA = 0, magB = 0;
        for (int i = 0; i < a.size(); i++) {
            dot  += a.get(i) * b.get(i);
            magA += a.get(i) * a.get(i);
            magB += b.get(i) * b.get(i);
        }
        double denom = Math.sqrt(magA) * Math.sqrt(magB);
        return denom == 0 ? 0.0 : dot / denom;
    }
}
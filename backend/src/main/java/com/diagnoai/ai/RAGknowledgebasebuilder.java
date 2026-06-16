package com.diagnoai.ai;

import com.diagnoai.config.RAGconfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.time.Instant;
import java.util.*;

/**
 * RAGKnowledgeBaseBuilder — pure Spring Boot replacement for build_rag.py.
 *
 * What it does:
 *   1. Reads every .json file from medical_data/
 *   2. Flattens nested JSON → readable key: value text
 *   3. Splits text into overlapping chunks
 *   4. Embeds each chunk via local Ollama (nomic-embed-text)
 *   5. Writes rag_knowledge_base.json

 */
@Service
public class RAGknowledgebasebuilder {

    @Autowired
    private RAGconfig config;

    @Autowired
    private RAGservice ragService;          // reloads after build

    private final ObjectMapper  mapper      = new ObjectMapper();
    private final RestTemplate  restTemplate = new RestTemplate();

    // ── Startup hook ──────────────────────────────────────────────────────

    @PostConstruct
    public void onStartup() {
        if (config.getRag().isRebuildOnStartup()) {
            System.out.println("[RAGBuilder] rebuild-on-startup=true → building now...");
            BuildResult result = build();
            System.out.println("[RAGBuilder] " + result.message());
        }
    }

    // ── Main build method (called on startup or via controller) ───────────

    public BuildResult build() {
        String dataDir    = config.getRag().getMedicalDataDir();
        String outputPath = config.getRag().getKnowledgeBasePath();

        // 1. Locate source files
        File dir = new File(dataDir);
        if (!dir.exists()) {
            dir.mkdirs();
            return new BuildResult(false,
                "Created '" + dataDir + "/' — add your medical .json files and rebuild.");
        }

        File[] files = dir.listFiles(f -> f.getName().endsWith(".json") || f.getName().endsWith(".txt"));
        if (files == null || files.length == 0) {
            return new BuildResult(false,
                "No .json files found in '" + dataDir + "'.");
        }
        

        // 2. Process each file
        ArrayNode chunks   = mapper.createArrayNode();
        List<String> names = new ArrayList<>();

        for (File file : files) {
            names.add(file.getName());
            System.out.println("[RAGBuilder] Processing: " + file.getName());
            try {
                List<String> texts = new ArrayList<>();


               if (file.getName().endsWith(".json")) {

            JsonNode data = mapper.readTree(file);
            texts.addAll(extractTexts(data));

        } else if (file.getName().endsWith(".txt")) {

            texts.addAll(parseBdpmTxt(file));

        }
                int MAX_CHUNKS_PER_FILE = 500;
                int chunk_counter = 0;
                for (int ri = 0; ri < texts.size(); ri++) {
                    List<String> textChunks = chunk(texts.get(ri));
                    for (int ci = 0; ci < textChunks.size(); ci++) {
                        String chunkText = textChunks.get(ci);
                        if (chunk_counter >= MAX_CHUNKS_PER_FILE) break;
                        System.out.printf("  Embedding record %d chunk %d/%d...%n",
                                ri, ci + 1, textChunks.size());

                        List<Double> embedding = embed(chunkText);
                        if (embedding.isEmpty()) {
                            return new BuildResult(false,
                                "Embedding failed — is Ollama running? (ollama serve)");
                        }

                        ObjectNode chunkNode = mapper.createObjectNode();
                        chunkNode.put("id",          file.getName() + "_r" + ri + "_c" + ci);
                        chunkNode.put("source_file", file.getName());
                        chunkNode.put("record_id",   file.getName() + "_" + ri);
                        chunkNode.put("chunk_index", ci);
                        chunkNode.put("text",        chunkText);

                        ArrayNode embArray = chunkNode.putArray("embedding");
                        embedding.forEach(embArray::add);

                        chunks.add(chunkNode);

                        chunk_counter++;
                    }
                }

            } catch (IOException e) {
                System.err.println("[RAGBuilder] Skipping " + file.getName()
                        + " — parse error: " + e.getMessage());
            }
        }

        // 3. Write output JSON
        ObjectNode output = mapper.createObjectNode();
        ObjectNode meta   = output.putObject("meta");
        meta.put("created_at",    Instant.now().toString());
        meta.put("embed_model",   config.getOllama().getEmbedModel());
        meta.put("chunk_size",    config.getRag().getChunkSize());
        meta.put("chunk_overlap", config.getRag().getChunkOverlap());
        meta.put("total_chunks",  chunks.size());
        ArrayNode srcArr = meta.putArray("source_files");
        names.forEach(srcArr::add);

        output.set("chunks", chunks);

        try {
            mapper.writerWithDefaultPrettyPrinter().writeValue(new File(outputPath), output);
        } catch (IOException e) {
            return new BuildResult(false, "Failed to write output: " + e.getMessage());
        }

        // 4. Tell RAGService to reload
        ragService.reload();

        String msg = String.format(
            "Done! %d chunks from %d file(s) → %s", chunks.size(), files.length, outputPath);
        return new BuildResult(true, msg);
    }

    // ── Text extraction ───────────────────────────────────────────────────

    /**
     * Flatten any JSON structure (object or array of objects) into
     * a list of "key: value" text blocks — one block per top-level record.
     */
    private List<String> extractTexts(JsonNode data) {
        List<String> result = new ArrayList<>();
        if (data.isArray()) {
            data.forEach(item -> result.add(flattenToText(item, "")));
        } else {
            result.add(flattenToText(data, ""));
        }
        return result;
    }

    private String flattenToText(JsonNode node, String prefix) {
        StringBuilder sb = new StringBuilder();
        if (node.isObject()) {
            node.fields().forEachRemaining(entry -> {
                String key = prefix.isEmpty() ? entry.getKey() : prefix + "." + entry.getKey();
                sb.append(flattenToText(entry.getValue(), key));
            });
        } else if (node.isArray()) {
            int i = 0;
            for (JsonNode item : node) {
                sb.append(flattenToText(item, prefix + "[" + i++ + "]"));
            }
        } else if (!node.isNull() && !node.asText().isBlank()) {
            sb.append(prefix).append(": ").append(node.asText()).append("\n");
        }
        return sb.toString();
    }
    private List<String> parseBdpmTxt(File file) throws IOException {

    List<String> result = new ArrayList<>();

    List<String> lines = Files.readAllLines(
            file.toPath(),
            java.nio.charset.Charset.forName("ISO-8859-1"));

    for (String line : lines) {

        String[] cols = line.split("\t");

        StringBuilder sb = new StringBuilder();

        for (int i = 0; i < cols.length; i++) {
            sb.append("col")
              .append(i)
              .append(": ")
              .append(cols[i])
              .append("\n");
        }

        result.add(sb.toString());
    }

    return result;
}

    // ── Chunking ──────────────────────────────────────────────────────────

    private List<String> chunk(String text) {
        int size    = config.getRag().getChunkSize();
        int overlap = config.getRag().getChunkOverlap();
        List<String> chunks = new ArrayList<>();
        int start = 0;
        while (start < text.length()) {
            int end = Math.min(start + size, text.length());
            chunks.add(text.substring(start, end));
            start += size - overlap;
        }
        return chunks;
    }

    // ── Ollama embedding ──────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private List<Double> embed(String text) {
        try {
            String url = config.getOllama().getBaseUrl() + "/api/embeddings";
            Map<String, String> body = Map.of(
                "model",  config.getOllama().getEmbedModel(),
                "prompt", text
            );
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

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
            System.err.println("[RAGBuilder] Embed error: " + e.getMessage());
        }
        return Collections.emptyList();
    }

    // ── Result record ─────────────────────────────────────────────────────

    public record BuildResult(boolean success, String message) {}
}
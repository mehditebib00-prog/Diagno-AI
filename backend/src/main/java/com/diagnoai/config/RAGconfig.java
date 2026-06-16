package com.diagnoai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Central config for RAG + Ollama settings.
 * All values come from application.properties under the "diagnoai" prefix.
 */
@Configuration
@ConfigurationProperties(prefix = "diagnoai")
public class RAGconfig {

    private Rag rag = new Rag();
    private Ollama ollama = new Ollama();

    public Rag getRag() { return rag; }
    public Ollama getOllama() { return ollama; }

    public static class Rag {
        /** Folder containing your source medical .json files */
        private String medicalDataDir = "medical_data";
        /** Output path for the built knowledge base */
        private String knowledgeBasePath = "rag_knowledge_base.json";
        /** Max characters per chunk */
        private int chunkSize = 1000;

        /** Overlap between consecutive chunks */
        private int chunkOverlap = 50;
        /** How many top chunks to return per query */
        private int topK = 5;
        /** If true, rebuilds the knowledge base on every app startup */
        private boolean rebuildOnStartup = false;

        public String getMedicalDataDir()    { return medicalDataDir; }
        public String getKnowledgeBasePath() { return knowledgeBasePath; }
        public int getChunkSize()            { return chunkSize; }
        public int getChunkOverlap()         { return chunkOverlap; }
        public int getTopK()                 { return topK; }
        public boolean isRebuildOnStartup()  { return rebuildOnStartup; }

        public void setMedicalDataDir(String v)    { this.medicalDataDir = v; }
        public void setKnowledgeBasePath(String v) { this.knowledgeBasePath = v; }
        public void setChunkSize(int v)            { this.chunkSize = v; }
        public void setChunkOverlap(int v)         { this.chunkOverlap = v; }
        public void setTopK(int v)                 { this.topK = v; }
        public void setRebuildOnStartup(boolean v) { this.rebuildOnStartup = v; }
    }

    public static class Ollama {
        private String baseUrl    = "http://localhost:11434";
        private String embedModel = "nomic-embed-text";
        private String chatModel  = "llama3";

        public String getBaseUrl()    { return baseUrl; }
        public String getEmbedModel() { return embedModel; }
        public String getChatModel()  { return chatModel; }

        public void setBaseUrl(String v)    { this.baseUrl = v; }
        public void setEmbedModel(String v) { this.embedModel = v; }
        public void setChatModel(String v)  { this.chatModel = v; }
    }
}
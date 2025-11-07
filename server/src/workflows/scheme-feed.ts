import "dotenv/config";
// import schemesData from "../../../schemes.json";
import { QdrantVectorStore } from "@langchain/qdrant";
import { Embeddings } from "@langchain/core/embeddings";
import { VectorStore } from "@langchain/core/vectorstores";
import { Chunk, Scheme, SchemeMetadata } from "../types.js";
import { DocumentInterface } from "@langchain/core/documents";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

class SchemeFeed {
  private embeddings?: Embeddings;
  private vectorStore?: VectorStore;

  async config() {
    try {
      this.embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GOOGLE_API_KEY!,
        model: "text-embedding-004",
      });

      this.vectorStore = await QdrantVectorStore.fromExistingCollection(
        this.embeddings,
        {
          url: process.env.QDRANT_ENDPOINT!,
          collectionName: "schemes-data",
          apiKey: process.env.QDRANT_API_KEY!,
        }
      );
      console.log(this.vectorStore);
    } catch (error) {
      console.error("Failed to initialize SchemeFeed:", error);
      throw error;
    }
  }

  public proprocessSchemes(data: Scheme[]): Chunk[] {
    const chunks: Chunk[] = [];

    for (const scheme of data) {
      const basicInfo: Chunk = {
        scheme_name: scheme.scheme_name,
        ministry: scheme.ministry,
        objective: scheme.objective,
        benefit: scheme.benefit,
        chunk_type: "overview",
        last_updated: scheme.last_updated,
        official_website: scheme.official_website,
      };

      chunks.push(basicInfo);

      const eligibilityInfo: Chunk = {
        scheme_name: scheme.scheme_name,
        eligibility_criteria: scheme.eligibility.criteria,
        exclusions: scheme.exclusions || [],
        chunk_type: "eligibility",
        last_updated: scheme.last_updated,
        official_website: scheme.official_website,
      };

      chunks.push(eligibilityInfo);

      const applicationsInfo: Chunk = {
        scheme_name: scheme.scheme_name,
        application_process: scheme.application_process,
        chunk_type: "application",
        documents_required: scheme.documents_required,
        official_website: scheme.official_website,
        last_updated: scheme.last_updated,
      };

      chunks.push(applicationsInfo);

      if (scheme.features && scheme.features.length > 0) {
        const featuresInfo: Chunk = {
          scheme_name: scheme.scheme_name,
          features: scheme.features,
          chunk_type: "features",
          last_updated: scheme.last_updated,
          official_website: scheme.official_website,
        };
        chunks.push(featuresInfo);
      }
    }

    return chunks;
  }

  public async storeIntoVectorDB(chunks: Chunk[]) {
    const documents: DocumentInterface[] = [];

    for (let idx = 0; idx < chunks.length; idx++) {
      const chunk = chunks[idx];
      const contentParts: string[] = [];

      switch (chunk.chunk_type) {
        case "overview":
          contentParts.push(
            `Scheme: ${chunk.scheme_name}`,
            `Ministry: ${chunk.ministry}`,
            `Objective: ${this.formatObjective(chunk.objective)}`,
            `Benefits: ${chunk.benefit || ""}`
          );
          break;

        case "eligibility":
          const criteria =
            chunk.eligibility_criteria?.map((c) => `- ${c}`).join("\n") || "";
          const exclusions =
            chunk.exclusions?.map((e) => `- ${e}`).join("\n") || "";
          contentParts.push(
            `Scheme: ${chunk.scheme_name}`,
            `Eligibility Criteria:\n${criteria}`,
            exclusions ? `Exclusions:\n${exclusions}` : ""
          );
          break;

        case "application":
          const docs =
            chunk.documents_required?.map((d) => `- ${d}`).join("\n") || "";
          contentParts.push(
            `Scheme: ${chunk.scheme_name}`,
            `Application Process: ${chunk.application_process}`,
            `Documents Required:\n${docs}`,
            `Website: ${chunk.official_website}`
          );
          break;

        case "features":
          const features =
            chunk.features?.map((f) => `- ${f}`).join("\n") || "";
          contentParts.push(
            `Scheme: ${chunk.scheme_name}`,
            `Features:\n${features}`
          );
          break;
      }

      const content = contentParts.filter((part) => part.trim()).join("\n");

      const metadata: SchemeMetadata = {
        scheme_name: chunk.scheme_name,
        ministry: chunk.ministry || "",
        chunk_type: chunk.chunk_type,
        last_updated: chunk.last_updated || "",
        official_website: chunk.official_website || "",
      };

      documents.push({
        pageContent: content,
        metadata,
        id: `${chunk.scheme_name}_${chunk.chunk_type}_${idx}`,
      });
    }

    console.log("Documents:", documents[2]);
    // console.log(this.vectorStore);

    await this.vectorStore?.addDocuments(documents);
  }

  public async searchSchemes(
    query: string,
    topK: number = 5,
    filters?: Partial<SchemeMetadata>
  ): Promise<DocumentInterface[] | string> {
    try {
      let retriever = this.vectorStore!.asRetriever({
        searchType: "similarity",
        k: topK,
        vectorStore: this.vectorStore,
        filter: filters,
      });

      const searchResults = await retriever?.invoke(query, {
        metadata: filters,
      });

      if (!searchResults) return "Nothing found";

      return searchResults;
    } catch (error) {
      console.error("SEARCHRESULTS:", error);
      return "Something went wrong.";
    }
  }

  private formatObjective(objective: string | string[] | undefined): string {
    if (!objective) return "";
    if (Array.isArray(objective)) {
      return objective.join(" ");
    }
    return objective;
  }
}

export const schemeFeed = new SchemeFeed();

// (async () => {
//   await schemeFeed.config();
//   const chunks = schemeFeed.proprocessSchemes(schemesData);
//   await schemeFeed.storeIntoVectorDB(chunks);
// })();

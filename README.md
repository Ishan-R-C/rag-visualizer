# RAGVIZ

Demystify Retrieval-Augmented Generation (RAG) with interactive 3D visualizations and step-by-step pipeline exploration

## What is RAGVIZ?

RAGViz is a **RAG Visualizer** which acts as an interactive web application that takes the mystery out of Retrieval-Augmented Generation (RAG) systems. Instead of treating LLMs as a black box, this tool lets you:

- **Upload PDFs** and see how they're processed into chunks
- **Visualize embeddings** in 3D space using UMAP dimensionality reduction
- **Watch vector search** in real-time as queries find relevant information
- **Understand response generation** by seeing exactly which chunks inform the AI's answers

Perfect for students, researchers, and developers who want to grasp how modern LLMs retrieve and generate information.

## Key Features

### Data Ingestion

- **PDF Upload**: Drag-and-drop PDF files (up to 2MB)
- **Text Extraction**: Automatic page-by-page processing with formatting preservation
- **Real-time Preview**: See extracted text, page count, and character statistics instantly

### Text Splitting

- **Multiple Strategies**:
  - **Recursive Character Splitting**: Intelligent splitting on natural boundaries (paragraphs, sentences, words)
  - **Fixed-Size Chunking**: Consistent chunk sizes with customizable overlap
  - **Token-Based Splitting**: Precise token-aware chunking for LLM compatibility
- **Interactive Controls**: Adjust chunk size, overlap, and see real-time statistics
- **Overlap Analysis**: Visualize actual vs. configured overlap between chunks

### Vector Embeddings & 3D Visualization

- **High-Quality Embeddings**: Powered by Google's Gemini embedding model
- **3D UMAP Visualization**: See your text chunks in an interactive 3D scatter plot
- **Color-Coded Points**: Visual cues based on embedding dimensions
- **Real-time Query Projection**: Watch your search queries appear in the embedding space
- **Similarity Search**: See the topmost relevant chunks highlighted in 3D space

### Response Generation

- **Context-Aware Answers**: AI responses based solely on retrieved document chunks
- **Configurable Parameters**: Adjust temperature, top-k, top-p, and max tokens
- **Custom System Messages**: Define the AI's behavior and expertise
- **Source Transparency**: Know exactly which chunks contributed to each answer

## Architecture

### Backend (Python/FastAPI)

- **PDF Processing**: Extract text from uploaded PDFs with intelligent formatting
- **Text Chunking**: Multiple algorithms for optimal text segmentation
- **Embeddings**: High-dimensional vector representations using Gemini
- **Dimensionality Reduction**: UMAP for 3D visualization
- **Similarity Search**: Cosine similarity for efficient retrieval
- **Response Generation**: Context-aware AI responses

### Frontend (Next.js/React)

- **Interactive Pipeline**: Step-by-step RAG process exploration
- **3D Visualizations**: Immersive embedding space exploration
- **Real-time Updates**: Live progress tracking and streaming responses

## How to Use

1. **Upload a PDF**: Start by uploading any PDF document (academic papers work great!)
2. **Explore Text Splitting**: Try different chunking strategies and see how they affect your text
3. **Generate Embeddings**: Watch as your chunks are transformed into 3D visualizations
4. **Query the System**: Ask questions and see how the AI retrieves relevant information
5. **Analyze Responses**: Understand which chunks contributed to each answer

## Acknowledgments

- **Google Gemini** for embedding and generation models
- **UMAP** for dimensionality reduction
- **LangChain** for text splitting utilities
- **Plotly** for interactive 3D visualizations
- **shadcn/ui** for the component library

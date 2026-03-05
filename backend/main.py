from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
import io
import os
from fastapi import Body
import numpy as np
import re
import asyncio
from google import genai
from google.genai import types
from dotenv import load_dotenv
from fastapi.responses import StreamingResponse
import json
load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

_umap_reducer = None
_chunk_embeddings = None  
_chunks = None  

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","https://rag-visualizer-beta.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "ok"}

async def embed_texts(texts: list[str]) -> np.ndarray:
    result = await client.aio.models.embed_content(
        model="gemini-embedding-001",
        contents=texts,
    )
    return np.array([e.values for e in result.embeddings])

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    contents = await file.read()
    pdf = PdfReader(io.BytesIO(contents))

    page_count = len(pdf.pages)
    pages_text = []

    for page in pdf.pages:
        text = page.extract_text()

        if text:
            # Normalize line endings
            text = text.replace("\r\n", "\n").replace("\r", "\n")
            # Remove excessive empty lines (keep paragraph structure)
            text = re.sub(r"\n{3,}", "\n\n", text)
            # Strip trailing whitespace
            text = text.strip()
            pages_text.append(text)

    # Natural page separation (just empty line)
    full_text = "\n\n".join(pages_text)

    character_count = len(full_text)

    return {
        "filename": file.filename,
        "page_count": page_count,
        "character_count": character_count,
        "text": full_text
    }

def compute_actual_overlap(prev_chunk: str, current_chunk: str) -> int:
    max_possible = min(len(prev_chunk), len(current_chunk))
    best = 0
    for length in range(1, max_possible + 1):
        if prev_chunk[-length:] == current_chunk[:length]:
            best = length
    return best

@app.post("/split-text")
async def split_text(payload: dict = Body(...)):
    #LOADING
    text = payload["text"]
    chunk_size = payload["chunk_size"]
    overlap = payload["overlap"]
    strategy = payload["strategy"]

    #CHECKS
    if chunk_size <= 0:
        return {"error": "Chunk size must be greater than 0."}

    if overlap < 0:
        return {"error": "Overlap cannot be negative."}

    if overlap >= chunk_size:
        return {"error": "Overlap must be smaller than chunk size."}

    loop = asyncio.get_event_loop()

    def do_split():
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        from langchain_text_splitters import TokenTextSplitter
        import tiktoken

        #FIXED-SIZE CHUNKING
        if strategy == "fixed-size":
            chunks = []
            start = 0

            while start < len(text):
                end = start + chunk_size
                chunks.append(text[start:end])
                start += chunk_size - overlap
            overlaps = []
            num_chunks = len(chunks)
            chunk_lengths = [len(chunk) for chunk in chunks]


        #RECURSIVE CHARACTER CHUNKING
        elif strategy == "recursive-character":
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=overlap,
                separators=["\n\n", "\n", ". ", "? ", "! ", " ", ""]
            )
            chunks = text_splitter.split_text(text) 
            overlaps = []
            num_chunks = len(chunks)
            chunk_lengths = [len(chunk) for chunk in chunks]


        #TOKEN BASED CHUNKING   
        elif strategy == "token":
            splitter = TokenTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=overlap
            )
            chunks = splitter.split_text(text)
            overlaps = []
            num_chunks = len(chunks)
            encoding = tiktoken.get_encoding("cl100k_base")
            chunk_lengths = [len(encoding.encode(chunk)) for chunk in chunks]
        
        else: 
            return {"error": "Invalid strategy."}
            
        #CALCULATIONS

        avg_chunk_size = (
            round(sum(chunk_lengths) / num_chunks, 2)
            if num_chunks > 0 else 0
        )

        min_chunk_size = min(chunk_lengths) if num_chunks > 0 else 0
        max_chunk_size = max(chunk_lengths) if num_chunks > 0 else 0

        for i in range(1, num_chunks):
            actual = compute_actual_overlap(chunks[i - 1], chunks[i])
            overlaps.append(actual)

        num_overlaps = len(overlaps)
        avg_overlap = (
            round(sum(overlaps) / num_overlaps, 2)
            if num_overlaps > 0 else 0
        )
        
        #RESULT
        return {
            "chunks": chunks,
            "num_chunks": num_chunks,
            "avg_chunk_size": avg_chunk_size,
            "num_overlaps": num_overlaps,
            "avg_overlap": avg_overlap,
            "min_chunk_size": min_chunk_size,
            "max_chunk_size": max_chunk_size
        }

    return await loop.run_in_executor(None, do_split)

@app.post("/embed-3d-stream")
async def embed_3d_stream(payload: dict = Body(...)):
    global _umap_reducer, _chunk_embeddings, _chunks

    chunks = payload["chunks"]
    loop = asyncio.get_event_loop()

    async def generate():
        global _chunk_embeddings, _chunks, _umap_reducer

        yield json.dumps({"progress": 10, "stage": "Starting encoding..."}) + "\n"

        embeddings = await embed_texts(chunks)
        _chunk_embeddings = embeddings
        _chunks = chunks

        yield json.dumps({"progress": 50, "stage": "Encoding complete. Running UMAP..."}) + "\n"

        def fit_and_transform():
            global _umap_reducer
            import umap
            _umap_reducer = umap.UMAP(n_components=3, random_state=42)
            return _umap_reducer.fit_transform(embeddings)

        umap_future = loop.run_in_executor(None, fit_and_transform)

        progress = 50
        while not umap_future.done():
            await asyncio.sleep(0.5)
            progress += (95 - progress) * 0.15
            yield json.dumps({"progress": round(progress, 1), "stage": "Running UMAP..."}) + "\n"

        reduced = await umap_future

        yield json.dumps({"progress": 100, "points": reduced.tolist()}) + "\n"

    return StreamingResponse(generate(), media_type="application/x-ndjson")

@app.post("/embed-query")
async def embed_query(payload: dict = Body(...)):
    #Projects a single query string into the existing UMAP space.
    global _umap_reducer, _chunk_embeddings, _chunks
    if _umap_reducer is None or _chunk_embeddings is None or _chunks is None:
        return {"error": "No embedding space found. Please generate chunk embeddings first."}
    
    query = payload["query"]
    loop = asyncio.get_event_loop()

    #Encode the query into high-dim embedding space
    query_embedding = await embed_texts([query])

    query_point = await loop.run_in_executor(
        None, lambda: _umap_reducer.transform(query_embedding)
    )

    # Cosine similarity in original high-dim space
    def find_top5():
        q = query_embedding[0]
        q_norm = q / np.linalg.norm(q)
        chunk_norms = _chunk_embeddings / np.linalg.norm(_chunk_embeddings, axis=1, keepdims=True)
        similarities = chunk_norms @ q_norm
        top5_indices = np.argsort(similarities)[::-1][:5]
        return [
            {
                "index": int(i),
                "chunk": _chunks[i],
                "similarity": float(similarities[i])
            }
            for i in top5_indices
        ]

    top5 = await loop.run_in_executor(None, find_top5)

    return {
        "point": query_point[0].tolist(),
        "top_chunks": top5
    }

@app.post("/generate-response")
async def generate_response(payload: dict = Body(...)):
    temperature = payload["temperature"]
    top_k = payload["top_k"]
    top_p = payload["top_p"]
    max_tokens = payload["max_tokens"]
    system_message = payload["system_message"]
    query = payload["query"]
    
    global _umap_reducer, _chunk_embeddings, _chunks
    if _umap_reducer is None or _chunk_embeddings is None or _chunks is None:
        return {"error": "No embedding space found. Please generate chunk embeddings first."}
    
    loop = asyncio.get_event_loop()

    #Encode the query into high-dim embedding space
    query_embedding = await embed_texts([query])

    def find_top5():
        q = query_embedding[0]
        q_norm = q / np.linalg.norm(q)
        chunk_norms = _chunk_embeddings / np.linalg.norm(_chunk_embeddings, axis=1, keepdims=True)
        similarities = chunk_norms @ q_norm
        top5_indices = np.argsort(similarities)[::-1][:20]
        return [
            {
                "index": int(i),
                "chunk": _chunks[i],
                "similarity": float(similarities[i])
            }
            for i in top5_indices
        ]

    top5 = await loop.run_in_executor(None, find_top5)

    context = "\n\n".join(item['chunk'] for item in top5)

    prompt = f"""
    You are answering using ONLY the provided academic paper excerpts.

    Context:
    {context}

    Question:
    {query}

    Write a clear and complete definition using only the information in the context.
    If the context is insufficient, say so explicitly.
    Provide a complete, well-formed paragraph.
    """

    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_message,
            temperature=temperature,
            top_p=top_p,
            top_k=top_k,
            max_output_tokens=max_tokens,
        )
    )
    return {
        "answer": response.text
    }
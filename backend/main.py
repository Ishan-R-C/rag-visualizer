import io
import os
import re
import json
import asyncio
import numpy as np
from typing import List, Dict, Any

import tiktoken
import umap
from fastapi import FastAPI, UploadFile, File, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter, TokenTextSplitter
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

state: Dict[str, Any] = {
    "umap_reducer": None,
    "chunk_embeddings": None,
    "chunks": None
}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://rag-visualizer-beta.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def embed_texts(texts: List[str]) -> np.ndarray:
    result = await client.aio.models.embed_content(
        model="gemini-embedding-001",
        contents=texts,
    )
    return np.array([e.values for e in result.embeddings])

def compute_actual_overlap(prev_chunk: str, current_chunk: str) -> int:
    max_possible = min(len(prev_chunk), len(current_chunk), 500)
    best = 0
    for length in range(max_possible, 0, -1):
        if prev_chunk[-length:] == current_chunk[:length]:
            best = length
            break
    return best

def clear_memory():
    global state
    state["chunks"] = None
    state["chunk_embeddings"] = None
    state["umap_reducer"] = None

@app.get("/")
async def root():
    return {"status": "ok"}

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    clear_memory()

    contents = await file.read()
    try:
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

        if len(full_text) > 500000:
            return {"error": "PDF is too large for the Free Tier memory limits."}

        return {
            "filename": file.filename,
            "page_count": page_count,
            "character_count": character_count,
            "text": full_text
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/split-text")
async def split_text(payload: dict = Body(...)):
    #LOADING
    text = payload.get("text", "")
    chunk_size = payload.get("chunk_size", 500)
    overlap = payload.get("overlap", 50)
    strategy = payload.get("strategy", "recursive-character")

    #CHECKS
    if chunk_size <= 0:
        return {"error": "Chunk size must be greater than 0."}

    if overlap < 0:
        return {"error": "Overlap cannot be negative."}

    if overlap >= chunk_size:
        return {"error": "Overlap must be smaller than chunk size."}

    loop = asyncio.get_running_loop()

    def do_split():
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

        if len(chunks) > 1000:
            chunks = chunks[:1000]

        num_chunks = len(chunks)

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
    chunks = payload.get("chunks", [])
    loop = asyncio.get_running_loop()

    async def generate():
        yield json.dumps({"progress": 10, "stage": "Starting encoding..."}) + "\n"

        try:
            embeddings = await embed_texts(chunks)
            state["chunk_embeddings"] = embeddings
            state["chunks"] = chunks

            yield json.dumps({"progress": 50, "stage": "Encoding complete. Running UMAP..."}) + "\n"

            def fit_and_transform():
                reducer = umap.UMAP(
                    n_components=3,
                    random_state=42,
                    n_neighbors=min(15, len(chunks) - 1),
                    low_memory=True
                )
                return reducer, reducer.fit_transform(embeddings)

            umap_future = loop.run_in_executor(None, fit_and_transform)

            progress = 50
            while not umap_future.done():
                await asyncio.sleep(0.5)
                progress += (95 - progress) * 0.15
                yield json.dumps({"progress": round(progress, 1), "stage": "Running UMAP..."}) + "\n"

            reducer, reduced = await umap_future
            state["umap_reducer"] = reducer

            yield json.dumps({"progress": 100, "points": reduced.tolist()}) + "\n"
        except Exception as e:
            yield json.dumps({"error": str(e)}) + "\n"

    return StreamingResponse(generate(), media_type="application/x-ndjson")

@app.post("/embed-query")
async def embed_query(payload: dict = Body(...)):
    #Projects a single query string into the existing UMAP space.
    if state["umap_reducer"] is None or state["chunk_embeddings"] is None or state["chunks"] is None:
        return {"error": "No embedding space found. Please generate chunk embeddings first."}

    query = payload.get("query", "")
    loop = asyncio.get_running_loop()

    #Encode the query into high-dim embedding space
    query_embedding = await embed_texts([query])

    query_point = await loop.run_in_executor(
        None, lambda: state["umap_reducer"].transform(query_embedding)
    )

    # Cosine similarity in original high-dim space
    def find_top5():
        q = query_embedding[0]
        q_norm = q / np.linalg.norm(q)
        chunk_norms = state["chunk_embeddings"] / np.linalg.norm(state["chunk_embeddings"], axis=1, keepdims=True)
        similarities = chunk_norms @ q_norm
        top5_indices = np.argsort(similarities)[::-1][:5]
        return [
            {
                "index": int(i),
                "chunk": state["chunks"][i],
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
    if state["chunks"] is None:
        return {"error": "No embedding space found. Please generate chunk embeddings first."}

    temperature = payload.get("temperature", 0.7)
    top_k = payload.get("top_k", 40)
    top_p = payload.get("top_p", 0.9)
    max_tokens = payload.get("max_tokens", 500)
    system_message = payload.get("system_message", "You are a helpful assistant.")
    query = payload.get("query", "")

    loop = asyncio.get_running_loop()

    #Encode the query into high-dim embedding space
    query_embedding = await embed_texts([query])

    def find_top5():
        q = query_embedding[0]
        q_norm = q / np.linalg.norm(q)
        chunk_norms = state["chunk_embeddings"] / np.linalg.norm(state["chunk_embeddings"], axis=1, keepdims=True)
        similarities = chunk_norms @ q_norm
        top5_indices = np.argsort(similarities)[::-1][:20]
        return [
            {
                "index": int(i),
                "chunk": state["chunks"][i],
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
import os
import requests

import uvicorn
from fastapi import FastAPI, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from pydantic import BaseModel

from database import get_db, setup_db, Record

app = FastAPI()
USE_OPENAI = os.environ.get("USE_OPENAI", False)

def get_embeddings(text: str) -> list[float]:
    if USE_OPENAI:
        raise NotImplementedError
    else:
        respone = requests.post(
            "http://localhost:11434/api/embeddings",
            json={"model": "llama2", "prompt": text}
        )
        return respone.json()["embedding"]

def generate_answer(messages: list[dict], context: str) -> str:
    if USE_OPENAI:
        raise NotImplementedError
    else:
        respone = requests.post(
            "http://localhost:11434/api/chat",
            json={
                "stream": False,
                "model": "mixtral",
                "messages": [
                    {
                        "role": "system",
                        "content": f"You are a useful assistant, answering questions for the user, based on the given context.\n\nContext:\n{context}"
                    },
                    *messages
                ]
            }
        )
        return respone.json()["message"]["content"]

# API routes
class NewRecord(BaseModel):
    text: str

class Chat(BaseModel):
    messages: list[dict]

@app.post("/record/")
async def create_item(record: NewRecord, db: Session = Depends(get_db)):
    record_embeddings = get_embeddings(record.text)
    new_record = Record(raw_data=record.text, embeddings=record_embeddings)
    db.add(new_record)
    db.commit()
    return {"msg": "done"}

@app.get("/ask/")
async def ask(chat: Chat, db: Session = Depends(get_db)):
    last_message = chat.messages[-1]
    record_embeddings = get_embeddings(last_message)
    results = db.scalars(select(Record).order_by(Record.embeddings.l2_distance(record_embeddings)).limit(5)).all()
    
    context = "\n".join([r.raw_data for r in results])
    answer = generate_answer(chat.messages, context)
    return {"hello": answer}


if __name__ == "__main__":
    setup_db()
    uvicorn.run(app, host="0.0.0.0", port=8000)

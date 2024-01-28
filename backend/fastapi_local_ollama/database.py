import os
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import create_engine, Column, Integer, DateTime, String
from sqlalchemy.orm import declarative_base, mapped_column, Session

# Database setup
DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)
Base = declarative_base()

class Record(Base):
    __tablename__ = "records"
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    raw_data = Column(String, nullable=False)
    embeddings = mapped_column(Vector(4096))


def get_db() -> Session:
    db = Session(engine)
    try:
        yield db
    finally:
        db.close()

def setup_db():
    Base.metadata.create_all(bind=engine)
"""
SQLAlchemy Datenbankmodelle
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Text
from sqlalchemy.sql import func
from database import Base


class Trade(Base):
    """Modell für Aktiengeschäfte von Politikern"""
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    
    # Politiker-Informationen
    politician_name = Column(String, index=True, nullable=False)
    party = Column(String, index=True)  # Partei (R, D, I)
    chamber = Column(String, index=True)  # House oder Senate
    state = Column(String)
    district = Column(String, nullable=True)
    
    # Trade-Informationen
    transaction_date = Column(Date, index=True)
    disclosure_date = Column(Date)
    ticker = Column(String, index=True)
    asset_name = Column(String)
    asset_type = Column(String)
    transaction_type = Column(String, index=True)  # Purchase, Sale, Exchange
    
    # Finanzdaten
    amount_range = Column(String)  # z.B. "$1,001 - $15,000"
    amount_min = Column(Float, nullable=True)
    amount_max = Column(Float, nullable=True)
    
    # Metadaten
    owner = Column(String)  # self, spouse, child, joint
    source_url = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Trade(politician={self.politician_name}, ticker={self.ticker}, type={self.transaction_type}, date={self.transaction_date})>"


class Politician(Base):
    """Modell für Politiker-Stammdaten"""
    __tablename__ = "politicians"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    party = Column(String)
    chamber = Column(String)
    state = Column(String)
    district = Column(String, nullable=True)
    profile_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Politician(name={self.name}, party={self.party}, chamber={self.chamber})>"



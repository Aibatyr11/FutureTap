"""
Script to recreate ML models from clubs_catalog.csv
Run this if pickle files are corrupted or need to be updated.
"""
import os
import pickle
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, 'clubs_catalog.csv')
VECTORIZER_PATH = os.path.join(BASE_DIR, 'vectorizer.pkl')
TFIDF_PATH = os.path.join(BASE_DIR, 'club_tfidf.pkl')

print("Loading clubs catalog...")
df = pd.read_csv(CSV_PATH)
print(f"Found {len(df)} clubs")

# Use the 'club_text' column for TF-IDF (combined text from name, description, tags)
text_data = df['club_text'].fillna('')

print(f"Text data samples: {text_data.head()}")
print(f"Text data shape: {text_data.shape}")

# Create and fit TF-IDF vectorizer
print("\nTraining TF-IDF vectorizer...")
vectorizer = TfidfVectorizer(
    max_features=1000,
    stop_words='english',
    ngram_range=(1, 2)
)

club_tfidf = vectorizer.fit_transform(text_data)

print(f"TF-IDF matrix shape: {club_tfidf.shape}")
print(f"Vocabulary size: {len(vectorizer.vocabulary_)}")

# Save models
print(f"\nSaving vectorizer to {VECTORIZER_PATH}...")
with open(VECTORIZER_PATH, 'wb') as f:
    pickle.dump(vectorizer, f, protocol=pickle.HIGHEST_PROTOCOL)

print(f"Saving TF-IDF matrix to {TFIDF_PATH}...")
with open(TFIDF_PATH, 'wb') as f:
    pickle.dump(club_tfidf, f, protocol=pickle.HIGHEST_PROTOCOL)

print("\n✓ Models saved successfully!")
print("\nTesting...")

# Test loading
with open(VECTORIZER_PATH, 'rb') as f:
    loaded_vectorizer = pickle.load(f)

with open(TFIDF_PATH, 'rb') as f:
    loaded_tfidf = pickle.load(f)

print(f"✓ Vectorizer loaded: {type(loaded_vectorizer)}")
print(f"✓ TF-IDF matrix loaded: shape={loaded_tfidf.shape}")

# Test recommendation
test_interests = "robotics programming AI"
test_vector = loaded_vectorizer.transform([test_interests])
from sklearn.metrics.pairwise import cosine_similarity
similarities = cosine_similarity(test_vector, loaded_tfidf).flatten()

print(f"\nTest query: '{test_interests}'")
print("Top 3 clubs:")
top_indices = similarities.argsort()[-3:][::-1]
for idx in top_indices:
    print(f"  - {df.iloc[idx]['name']}: similarity={similarities[idx]:.4f}")

print("\n✓ All tests passed!")

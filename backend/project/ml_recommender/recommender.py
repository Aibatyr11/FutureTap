"""
ML-based Content-Based Club Recommendation System

Uses pre-trained TF-IDF vectorizer and club feature matrix
to recommend clubs based on user interests text.

Files required:
- vectorizer.pkl: TfidfVectorizer fitted on club descriptions
- club_tfidf.pkl: TF-IDF matrix for all clubs
- clubs_catalog.csv: Club metadata (club_id, name, description, tags, club_text)
"""

import os
import pickle
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from sklearn.metrics.pairwise import cosine_similarity


# Base directory for ML models
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class ClubRecommender:
    """
    Content-based club recommender using TF-IDF and cosine similarity.
    """

    def __init__(self):
        self.vectorizer = None
        self.club_tfidf = None
        self.clubs_df = None
        self._load_models()

    def _load_models(self):
        """Load pre-trained models and catalog."""
        try:
            # Load TF-IDF vectorizer
            vectorizer_path = os.path.join(BASE_DIR, 'vectorizer.pkl')
            with open(vectorizer_path, 'rb') as f:
                self.vectorizer = pickle.load(f)

            # Load club TF-IDF matrix
            tfidf_path = os.path.join(BASE_DIR, 'club_tfidf.pkl')
            with open(tfidf_path, 'rb') as f:
                self.club_tfidf = pickle.load(f)

            # Load clubs catalog
            csv_path = os.path.join(BASE_DIR, 'clubs_catalog.csv')
            self.clubs_df = pd.read_csv(csv_path)

        except FileNotFoundError as e:
            raise RuntimeError(
                f"ML model files not found. Ensure vectorizer.pkl, "
                f"club_tfidf.pkl, and clubs_catalog.csv exist in {BASE_DIR}. "
                f"Missing: {e}"
            )
        except Exception as e:
            raise RuntimeError(f"Error loading ML models: {e}")

    def recommend(
        self,
        interests: str,
        top_n: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Recommend clubs based on user interests.

        Args:
            interests: Text description of user interests
                      (e.g., "I like robotics and programming")
            top_n: Number of recommendations to return

        Returns:
            List of dicts with club_id, name, description, tags, similarity
        """
        if not interests or not interests.strip():
            return []

        # Transform user interests to TF-IDF vector
        interests_tfidf = self.vectorizer.transform([interests])

        # Calculate cosine similarity with all clubs
        similarities = cosine_similarity(interests_tfidf, self.club_tfidf).flatten()

        # Add similarity scores to dataframe
        self.clubs_df = self.clubs_df.copy()
        self.clubs_df['similarity'] = similarities

        # Sort by similarity and get top N
        top_clubs = self.clubs_df.nlargest(top_n, 'similarity')

        # Filter out clubs with very low similarity (optional threshold)
        top_clubs = top_clubs[top_clubs['similarity'] > 0.05]

        # Convert to list of dicts
        recommendations = []
        for _, row in top_clubs.iterrows():
            recommendations.append({
                'club_id': int(row['club_id']),
                'name': str(row['name']),
                'description': str(row['description']),
                'tags': str(row['tags']).split(',') if pd.notna(row['tags']) else [],
                'similarity': round(float(row['similarity']), 4)
            })

        return recommendations

    def get_similar_clubs(
        self,
        club_id: int,
        top_n: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Find clubs similar to a given club.

        Args:
            club_id: ID of the reference club
            top_n: Number of similar clubs to return

        Returns:
            List of similar clubs with similarity scores
        """
        if club_id not in self.clubs_df['club_id'].values:
            return []

        # Get index of the club
        club_idx = self.clubs_df[
            self.clubs_df['club_id'] == club_id
        ].index[0]

        # Get TF-IDF vector for this club
        club_vector = self.club_tfidf[club_idx]

        # Calculate similarities with all clubs
        similarities = cosine_similarity(club_vector, self.club_tfidf).flatten()

        # Add to dataframe and get top N (excluding the club itself)
        self.clubs_df = self.clubs_df.copy()
        self.clubs_df['similarity'] = similarities

        similar = self.clubs_df[
            self.clubs_df['club_id'] != club_id
        ].nlargest(top_n, 'similarity')

        # Convert to list of dicts
        results = []
        for _, row in similar.iterrows():
            results.append({
                'club_id': int(row['club_id']),
                'name': str(row['name']),
                'description': str(row['description']),
                'tags': str(row['tags']).split(',') if pd.notna(row['tags']) else [],
                'similarity': round(float(row['similarity']), 4)
            })

        return results


# Global recommender instance (singleton pattern)
_recommender_instance: Optional[ClubRecommender] = None


def get_recommender() -> ClubRecommender:
    """Get or create the global recommender instance."""
    global _recommender_instance
    if _recommender_instance is None:
        _recommender_instance = ClubRecommender()
    return _recommender_instance


def recommend_clubs(
    interests: str,
    top_n: int = 5
) -> List[Dict[str, Any]]:
    """
    Convenience function to get club recommendations.

    Args:
        interests: Text description of user interests
        top_n: Number of recommendations to return

    Returns:
        List of recommended clubs with metadata and similarity scores

    Example:
        >>> recommendations = recommend_clubs("I like robotics and AI", top_n=3)
        >>> print(recommendations[0])
        {
            'club_id': 2,
            'name': 'Клуб робототехники',
            'description': 'Сборка и программирование роботов...',
            'tags': ['robotics', 'programming', 'engineering'],
            'similarity': 0.6543
        }
    """
    recommender = get_recommender()
    return recommender.recommend(interests=interests, top_n=top_n)

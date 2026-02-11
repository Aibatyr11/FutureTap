"""
AI-powered Club Recommendation Service for FutureTap

Uses content-based filtering with weighted scoring algorithm.
Can be extended with sklearn for more sophisticated recommendations.
"""
from typing import List, Dict, Any, Optional
from django.db.models import Q, Count, Avg
from .models import Club, Child, Category, Enrollment, RecommendationLog


class RecommendationEngine:
    """
    Recommendation engine that suggests clubs based on:
    - User/child interests
    - Age compatibility
    - Schedule preferences
    - Club popularity and ratings
    - Available capacity
    """

    # Weights for different factors (can be tuned)
    WEIGHTS = {
        'interest_match': 0.35,
        'age_match': 0.25,
        'schedule_match': 0.15,
        'popularity': 0.10,
        'rating': 0.10,
        'availability': 0.05,
    }

    def __init__(self, user=None, child: Optional[Child] = None):
        self.user = user
        self.child = child

    def get_recommendations(
        self,
        interests: List[str] = None,
        age: int = None,
        preferred_days: List[str] = None,
        max_results: int = 5,
        exclude_enrolled: bool = True
    ) -> Dict[str, Any]:
        """
        Generate club recommendations based on given criteria.

        Args:
            interests: List of interest categories ['STEM', 'Music', etc.]
            age: Age of the child/user
            preferred_days: Preferred days ['Monday', 'Wednesday', etc.]
            max_results: Maximum number of recommendations to return
            exclude_enrolled: Whether to exclude already enrolled clubs

        Returns:
            Dict with recommended clubs, reasons, and confidence scores
        """
        # Get child data if available
        if self.child:
            interests = interests or self.child.interests or []
            age = age or self.child.age

        # Get user preferences if available
        if self.user and not interests:
            interests = self.user.interests or self.user.preferred_categories or []
            preferred_days = preferred_days or self.user.preferred_schedule or []

        # Get all active clubs
        clubs = Club.objects.filter(is_active=True).select_related('category')

        # Exclude already enrolled clubs
        if exclude_enrolled and self.user:
            enrolled_club_ids = Enrollment.objects.filter(
                user=self.user,
                status='active'
            ).values_list('club_id', flat=True)
            clubs = clubs.exclude(id__in=enrolled_club_ids)

        # Score each club
        scored_clubs = []
        for club in clubs:
            score, reasons = self._calculate_score(
                club, interests, age, preferred_days
            )
            if score > 0:
                scored_clubs.append({
                    'club': club,
                    'score': score,
                    'reasons': reasons
                })

        # Sort by score descending
        scored_clubs.sort(key=lambda x: x['score'], reverse=True)

        # Take top N results
        top_clubs = scored_clubs[:max_results]

        # Calculate overall confidence
        avg_confidence = sum(c['score'] for c in top_clubs) / len(top_clubs) if top_clubs else 0

        # Log the recommendation
        if self.user:
            self._log_recommendation(
                clubs=[c['club'].id for c in top_clubs],
                preferences={
                    'interests': interests,
                    'age': age,
                    'preferred_days': preferred_days
                }
            )

        return {
            'clubs': [c['club'] for c in top_clubs],
            'details': top_clubs,
            'confidence_score': round(avg_confidence, 2),
            'reason': self._generate_summary_reason(interests, age, top_clubs)
        }

    def _calculate_score(
        self,
        club: Club,
        interests: List[str],
        age: int,
        preferred_days: List[str]
    ) -> tuple:
        """Calculate recommendation score for a single club."""
        score = 0.0
        reasons = []

        # Interest match
        if interests and club.category:
            if club.category.name in interests:
                interest_score = 1.0
                reasons.append(f"Matches interest: {club.category.name}")
            else:
                interest_score = 0.3  # Partial score for other categories
        else:
            interest_score = 0.5  # Neutral if no interests specified
        score += interest_score * self.WEIGHTS['interest_match']

        # Age match
        if age:
            if club.min_age <= age <= club.max_age:
                age_score = 1.0
                reasons.append(f"Age-appropriate: {club.age_range}")
            elif abs(age - club.min_age) <= 1 or abs(age - club.max_age) <= 1:
                age_score = 0.7  # Close to age range
            else:
                age_score = 0.0
        else:
            age_score = 0.5
        score += age_score * self.WEIGHTS['age_match']

        # Schedule match
        if preferred_days:
            day_matches = sum(1 for day in preferred_days if day in club.day)
            if day_matches > 0:
                schedule_score = min(day_matches / len(preferred_days), 1.0)
                reasons.append(f"Schedule fits: {club.day}")
            else:
                schedule_score = 0.3
        else:
            schedule_score = 0.5
        score += schedule_score * self.WEIGHTS['schedule_match']

        # Popularity (based on enrollments)
        popularity_score = min(club.enrolled_count / 20, 1.0)  # Normalize to max 20
        if popularity_score > 0.7:
            reasons.append("Popular choice")
        score += popularity_score * self.WEIGHTS['popularity']

        # Rating
        rating_score = float(club.rating) / 5.0
        if club.rating >= 4.5:
            reasons.append(f"Highly rated: {club.rating}★")
        score += rating_score * self.WEIGHTS['rating']

        # Availability
        if club.available_spots > 0:
            availability_score = min(club.available_spots / club.capacity, 1.0)
            if club.available_spots <= 3:
                reasons.append("Limited spots available!")
        else:
            availability_score = 0.0
            reasons.append("Currently full")
        score += availability_score * self.WEIGHTS['availability']

        # Featured clubs get a small boost
        if club.featured:
            score *= 1.1
            reasons.append("Featured club")

        return round(score, 3), reasons

    def _generate_summary_reason(
        self,
        interests: List[str],
        age: int,
        top_clubs: List[Dict]
    ) -> str:
        """Generate a human-readable summary of why these clubs were recommended."""
        if not top_clubs:
            return "No clubs match your criteria. Try broadening your search."

        reasons = []
        if interests:
            reasons.append(f"based on your interests in {', '.join(interests)}")
        if age:
            reasons.append(f"suitable for age {age}")

        if reasons:
            return f"Recommended {', '.join(reasons)}"
        return "Top clubs based on popularity and ratings"

    def _log_recommendation(self, clubs: List[int], preferences: Dict):
        """Log the recommendation for analytics."""
        if self.user:
            RecommendationLog.objects.create(
                user=self.user,
                child=self.child,
                recommended_clubs=clubs,
                user_preferences=preferences
            )

    @staticmethod
    def get_similar_clubs(club: Club, limit: int = 3) -> List[Club]:
        """Get clubs similar to a given club."""
        return Club.objects.filter(
            category=club.category,
            is_active=True
        ).exclude(id=club.id).order_by('-rating', '-enrolled_count')[:limit]

    @staticmethod
    def get_trending_clubs(limit: int = 5) -> List[Club]:
        """Get trending clubs based on recent enrollments."""
        from django.utils import timezone
        from datetime import timedelta

        recent_date = timezone.now() - timedelta(days=30)

        trending = Club.objects.filter(
            is_active=True,
            enrollments__enrollment_date__gte=recent_date
        ).annotate(
            recent_enrollments=Count('enrollments')
        ).order_by('-recent_enrollments', '-rating')[:limit]

        return list(trending)


def get_club_recommendations(
    user=None,
    child_id: int = None,
    interests: List[str] = None,
    age: int = None,
    preferred_days: List[str] = None,
    max_results: int = 5
) -> Dict[str, Any]:
    """
    Convenience function for getting recommendations.

    Usage:
        # For a user
        recommendations = get_club_recommendations(user=request.user, interests=['STEM', 'Music'])

        # For a specific child
        recommendations = get_club_recommendations(user=request.user, child_id=1, age=10)
    """
    child = None
    if child_id and user:
        try:
            child = Child.objects.get(id=child_id, parent=user)
        except Child.DoesNotExist:
            pass

    engine = RecommendationEngine(user=user, child=child)
    return engine.get_recommendations(
        interests=interests,
        age=age,
        preferred_days=preferred_days,
        max_results=max_results
    )

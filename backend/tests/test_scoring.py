"""Unit tests for the scoring engine — no DB required."""
import pytest

from app.models.prediction import Prediction, PredictedWinner
from app.services.scoring_service import calculate_prediction_points


def make_prediction(winner: str, score1: int, score2: int) -> Prediction:
    return Prediction(
        user_id=1,
        match_id=1,
        predicted_winner=PredictedWinner(winner),
        predicted_score_team1=score1,
        predicted_score_team2=score2,
    )


class TestScoringRules:
    def test_correct_winner_only(self):
        p = make_prediction("team1", 2, 1)
        assert calculate_prediction_points(p, 3, 0) == 1

    def test_exact_score_gives_3_points(self):
        p = make_prediction("team1", 2, 1)
        assert calculate_prediction_points(p, 2, 1) == 3

    def test_wrong_winner_gives_0(self):
        p = make_prediction("team1", 2, 1)
        assert calculate_prediction_points(p, 0, 1) == 0

    def test_correct_team2_winner_only(self):
        p = make_prediction("team2", 0, 2)
        assert calculate_prediction_points(p, 1, 3) == 1

    def test_correct_team2_exact_score(self):
        p = make_prediction("team2", 0, 2)
        assert calculate_prediction_points(p, 0, 2) == 3

    def test_exact_score_wrong_winner_gives_2(self):
        """Exact score but wrong winner (e.g. predicted tie, went to penalties) → 2 pts."""
        p = make_prediction("tie", 1, 1)
        assert calculate_prediction_points(p, 1, 1, actual_winner="team1") == 2

    # Finals / penalty shootout: explicit actual_winner overrides score derivation
    def test_penalty_winner_team2_correct(self):
        """Score is tied 1-1, team2 wins on penalties — predicted team2."""
        p = make_prediction("team2", 1, 1)
        assert calculate_prediction_points(p, 1, 1, actual_winner="team2") == 3

    def test_penalty_winner_team2_wrong_prediction(self):
        """Score is tied 1-1, team2 wins on penalties — predicted team1 with same score → 2 pts."""
        p = make_prediction("team1", 1, 1)
        assert calculate_prediction_points(p, 1, 1, actual_winner="team2") == 2

    def test_penalty_winner_correct_but_wrong_score(self):
        """Score 1-1, team2 wins — predicted team2 but different score."""
        p = make_prediction("team2", 0, 0)
        assert calculate_prediction_points(p, 1, 1, actual_winner="team2") == 1

    def test_explicit_winner_overrides_score_derivation(self):
        """Even when score clearly shows team1 winning, explicit actual_winner wins."""
        p = make_prediction("team2", 0, 3)
        assert calculate_prediction_points(p, 2, 1, actual_winner="team2") == 1

    # Backward compat: old tie predictions still work when no actual_winner set
    def test_tie_correct_winner_only(self):
        p = make_prediction("tie", 1, 1)
        assert calculate_prediction_points(p, 2, 2) == 1

    def test_tie_exact_score(self):
        p = make_prediction("tie", 1, 1)
        assert calculate_prediction_points(p, 1, 1) == 3

    def test_predicted_tie_actual_winner(self):
        p = make_prediction("tie", 1, 1)
        assert calculate_prediction_points(p, 2, 1) == 0

    def test_zero_zero_tie(self):
        p = make_prediction("tie", 0, 0)
        assert calculate_prediction_points(p, 0, 0) == 3

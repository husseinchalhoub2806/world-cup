"""Unit tests for the scoring engine — no DB required."""
import pytest

from app.models.prediction import Prediction, PredictedWinner
from app.services.scoring_service import calculate_prediction_points


def make_prediction(winner: str, score1: int, score2: int) -> Prediction:
    p = Prediction.__new__(Prediction)
    p.predicted_winner = PredictedWinner(winner)
    p.predicted_score_team1 = score1
    p.predicted_score_team2 = score2
    return p


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

    def test_tie_correct_winner_only(self):
        p = make_prediction("tie", 1, 1)
        assert calculate_prediction_points(p, 2, 2) == 1

    def test_tie_exact_score(self):
        p = make_prediction("tie", 1, 1)
        assert calculate_prediction_points(p, 1, 1) == 3

    def test_predicted_tie_actual_winner(self):
        p = make_prediction("tie", 1, 1)
        assert calculate_prediction_points(p, 2, 1) == 0

    def test_correct_team2_winner_only(self):
        p = make_prediction("team2", 0, 2)
        assert calculate_prediction_points(p, 1, 3) == 1

    def test_correct_team2_exact_score(self):
        p = make_prediction("team2", 0, 2)
        assert calculate_prediction_points(p, 0, 2) == 3

    def test_zero_zero_tie(self):
        p = make_prediction("tie", 0, 0)
        assert calculate_prediction_points(p, 0, 0) == 3

    def test_zero_zero_predicted_wrong_result(self):
        p = make_prediction("tie", 0, 0)
        assert calculate_prediction_points(p, 1, 0) == 0

    def test_exact_score_but_wrong_winner_impossible(self):
        """If exact score matches, winner always matches too."""
        p = make_prediction("team1", 2, 1)
        # Exact score means winner must match — verify 3 points
        assert calculate_prediction_points(p, 2, 1) == 3

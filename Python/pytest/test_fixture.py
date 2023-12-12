"""
import pytest

@pytest.fixture
def setup_data():
    data = {"key": "value"}
    return data

def test_data(setup_data):
    assert setup_data["key"] == "value"
"""

# test_calculator.py
import pytest
from calculator import add, subtract

# Fixture to provide initial data for addition tests
@pytest.fixture
def initial_data_for_addition():
    data = {"x": 5, "y": 3}
    return data

# Fixture to provide initial data for subtraction tests
@pytest.fixture
def initial_data_for_subtraction():
    data = {"x": 10, "y": 2}
    return data

# Test function for addition
def test_addition(initial_data_for_addition):
    result = add(initial_data_for_addition["x"], initial_data_for_addition["y"])
    assert result == 8

# Test function for subtraction
def test_subtraction(initial_data_for_subtraction):
    result = subtract(initial_data_for_subtraction["x"], initial_data_for_subtraction["y"])
    assert result == 8

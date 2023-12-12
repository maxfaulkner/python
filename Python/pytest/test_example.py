# test_example.py

def add(x, y):
    return x + y

def mult(x,y):
    return x*y

def test_addition():
    assert add(1, 2) == 3
    assert add(-1, 1) == 0
    assert add(-1, -1) == -2

def test_mult():
    assert mult(1,2) == 2
    assert mult(4,5) == 20

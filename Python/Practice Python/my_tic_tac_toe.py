class ttt: 
    def __init__(self):
        self.board = []
    
    def start(self):
        print("starting")
        self.create_board()
        self.show_board()
        self.user_input()
        

    def create_board(self):
        for i in range(3):
            row = []
            for j in range(3):
                row.append("-")
            self.board.append(row)

    def show_board(self):
        for row in self.board: #this has it loop through all of the rows
            for item in row: #this looks at whats in each thing
                print(item, end = " ") #this prints until there is nothing
            print() #this prints a new line so that the rows are seperated

    def user_input(self):
        self.row, self.col = list(map(int, input("enter row and col").split()))
        print()

   
        

tic_tac_toe = ttt()
tic_tac_toe.start()

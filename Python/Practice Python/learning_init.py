class car:
    def __init__ (self, color):
        self.color = color
        print(self.color)
        self.printer()

        
    def printer(self):
        print(self.color)

    


ford = car("red")




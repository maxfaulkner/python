"""
FUNCTIONS
"""
def parseString (string): #returns a parsed string and a word count
    newWords = []
    wordCount = 1
    currentString = ''
    for letter in string:
        if letter != ',' and letter != ' ':
            currentString += letter
        elif letter != ' ':
            newWords.append(currentString)
            currentString = ''
            wordCount += 1

    return newWords, wordCount

def checkForDups(words, count):
    notEqualWords = []

    for word in words:
        if word not in notEqualWords:
            notEqualWords.append(word)

    return notEqualWords
                        
"""
Varliables
"""
string = 'apple, apple, dog, pie, cat, shark, apple, dog'

"""
Functions Calls
"""
parsedStringAndCount = parseString(string) 
print(checkForDups(parsedStringAndCount[0],parsedStringAndCount[1]))
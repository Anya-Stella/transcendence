CXX = g++
CXXFLAGS = -Wall -Wextra -O3 -std=c++17

SRCS_COMMON = bitboard.cpp board.cpp
OBJS_COMMON = bitboard.o board.o

TARGETS = legal_checker engine

all: $(TARGETS)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c -o $@ $<

legal_checker: legal_checker.cpp $(OBJS_COMMON)
	$(CXX) $(CXXFLAGS) -o $@ legal_checker.cpp $(OBJS_COMMON)

engine: engine.cpp $(OBJS_COMMON)
	$(CXX) $(CXXFLAGS) -o $@ engine.cpp $(OBJS_COMMON)

clean:
	rm -f $(TARGETS) $(OBJS_COMMON)

Shrdlite AI-Project by
Albin Garpetun, John Petersson, Markus Andersson Norén & Jonathan Nilsfors

Apart from the standard files, and expected implementations we have the files:

RelationFunctions.ts
- This file has functions handling all the relations and physical laws.
It is used by the interpreter and planner to figure out what states are
possible.

StateGraph.ts
- This file is the foundation for the shrdlite graph. It has a node class which
contains a specific state. It also handles the outgoing edges function to
determine which states are possible to reach from another certain states.

Heuristic.ts
- The heuristic is implemented in this file. We have tried to make a smart
heuristic that makes different calculations depending on what relation we want
to perform (ontop, left of, above etc.). It also handles conjunctions so that
the quantifier all gets a different heuristic value.

Shrdlite.html & Shrdlite-html.ts
- We made some small modifications to the files shrdlite.html and shrdlite-html.ts.
We added form radio buttons to be able to switch between search algorithms.
A listener was also added to be able to modify the model.

Extensions

We have implemented the quantifier all and we do distinguish between the/any.
The all quantifier makes sure that conjunctions are made.
If the request has quantifier "the" and there are several objects it can refer
to, an error is thrown ("Need to specify the"). If the request has any as
quantifier, it is interpreted as any one of the possible objects. It makes
disjunctions for each case. To sum it up, the quantifier "the" needs to have
only one object associated to it. Otherwise it will fail.

Example for all: Medium world and state "Put all boxes on the floor"
Example for any: Medium world and state "Put any brick in a box"
Example for the: Medium world and state "Put the yellow pyramid under a box"

Mostly for our own interest we implemented DFS and BFS. These can be chosen
in the user interface and the number of nodes processed along with the total
length of the plan is printed to the user. This gives the possibility to compare
some of the algorithms that we have discussed in class. As stated, this we made
for own interest but it took some time and maybe you consider it a valid extension.

This can be tried out by switching between the different algorithms in the UI
and compare the outputs.

A lot of time was spent on the heuristic and maybe it could be considered an
extension itself. As mentioned earlier the heuristic handles the different
cases we can achieve
